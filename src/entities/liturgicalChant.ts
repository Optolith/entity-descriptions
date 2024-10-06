import { Compare } from "@optolith/helpers/compare"
import { isNotNullish } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import { Blessing } from "optolith-database-schema/types/Blessing"
import { Ceremony } from "optolith-database-schema/types/Ceremony"
import { DerivedCharacteristic } from "optolith-database-schema/types/DerivedCharacteristic"
import { LiturgicalChant } from "optolith-database-schema/types/LiturgicalChant"
import { SkillTradition } from "optolith-database-schema/types/_Blessed"
import { AspectReference } from "optolith-database-schema/types/_SimpleReferences"
import { GetById } from "../helpers/getTypes.js"
import { Translate, TranslateMap } from "../helpers/translate.js"
import {
  createLibraryEntryCreator,
  LibraryEntryContent,
} from "../libraryEntry.js"
import { getDurationTranslationForBlessing } from "./partial/rated/activatable/duration.js"
import { getTextForEffect } from "./partial/rated/activatable/effect.js"
import { Entity } from "./partial/rated/activatable/entity.js"
import {
  getFastOneTimePerformanceParametersTranslations,
  getFastSustainedPerformanceParametersTranslations,
  getSlowOneTimePerformanceParametersTranslations,
  getSlowSustainedPerformanceParametersTranslations,
} from "./partial/rated/activatable/index.js"
import { getTextForBlessingRange } from "./partial/rated/activatable/range.js"
import { getTargetCategoryTranslation } from "./partial/rated/activatable/targetCategory.js"
import { createImprovementCost } from "./partial/rated/improvementCost.js"
import { getTextForCheck } from "./partial/rated/skillCheck.js"
import { ResponsiveTextSize } from "./partial/responsiveText.js"

const getTextForTraditions = (
  deps: {
    translate: Translate
    translateMap: TranslateMap
    localeCompare: Compare<string>
    getBlessedTraditionById: GetById.Static.BlessedTradition
    getAspectById: GetById.Static.Aspect
  },
  values: SkillTradition[]
): LibraryEntryContent => {
  const getAspectName = (ref: AspectReference) =>
    deps.translateMap(deps.getAspectById(ref.id.aspect)?.translations)?.name

  const text = values
    .map((trad) => {
      switch (trad.tag) {
        case "GeneralAspect":
          return getAspectName(trad.general_aspect)
        case "Tradition": {
          const traditionTranslation = deps.translateMap(
            deps.getBlessedTraditionById(
              trad.tradition.tradition.id.blessed_tradition
            )?.translations
          )
          const name =
            traditionTranslation?.name_compressed ?? traditionTranslation?.name

          if (name === undefined) {
            return undefined
          }

          const aspects =
            trad.tradition.aspects
              ?.map(getAspectName)
              .filter(isNotNullish)
              .sort(deps.localeCompare) ?? []

          if (aspects.length === 0) {
            return name
          }

          return `${name} (${aspects.join(" and ")})`
        }
        default:
          return assertExhaustive(trad)
      }
    })
    .filter(isNotNullish)
    .join(", ")

  return {
    label: deps.translate("Traditions"),
    value: text,
  }
}

/**
 * Get a JSON representation of the rules text for a blessing.
 */
export const getBlessingLibraryEntry = createLibraryEntryCreator<
  Blessing,
  {
    getTargetCategoryById: GetById.Static.TargetCategory
  }
>((entry, { getTargetCategoryById }) => (locale) => {
  const { translate, translateMap } = locale
  const translation = translateMap(entry.translations)

  if (translation === undefined) {
    return undefined
  }

  const range = getTextForBlessingRange(
    locale,
    ResponsiveTextSize.Full,
    entry.parameters.range
  )

  const duration = getDurationTranslationForBlessing(
    locale,
    ResponsiveTextSize.Full,
    entry.parameters.duration
  )

  return {
    title: translation.name,
    className: "blessing",
    content: [
      {
        label: translate("Effect"),
        value: translation.effect,
      },
      {
        label: translate("Range"),
        value:
          range !== translation.range
            ? `***${range}*** (${translation.range})`
            : range,
      },
      {
        label: translate("Duration"),
        value:
          duration !== translation.duration
            ? `***${duration}*** (${translation.duration})`
            : duration,
      },
      getTargetCategoryTranslation(getTargetCategoryById, locale, entry.target),
    ],
    src: entry.src,
  }
})

/**
 * Get a JSON representation of the rules text for a liturgical chant.
 */
export const getLiturgicalChantLibraryEntry = createLibraryEntryCreator<
  LiturgicalChant,
  {
    getAttributeById: GetById.Static.Attribute
    getSpirit: () => DerivedCharacteristic | undefined
    getToughness: () => DerivedCharacteristic | undefined
    getSkillModificationLevelById: GetById.Static.SkillModificationLevel
    getTargetCategoryById: GetById.Static.TargetCategory
    getBlessedTraditionById: GetById.Static.BlessedTradition
    getAspectById: GetById.Static.Aspect
  }
>(
  (
      entry,
      {
        getAttributeById,
        getSpirit,
        getToughness,
        getSkillModificationLevelById,
        getTargetCategoryById,
        getBlessedTraditionById,
        getAspectById,
      }
    ) =>
    (locale) => {
      const { translate, translateMap, compare: localeCompare } = locale
      const translation = translateMap(entry.translations)

      if (translation === undefined) {
        return undefined
      }

      const { castingTime, cost, range, duration } = (() => {
        switch (entry.parameters.tag) {
          case "OneTime":
            return getFastOneTimePerformanceParametersTranslations(
              getSkillModificationLevelById,
              locale,
              Entity.LiturgicalChant,
              ResponsiveTextSize.Full,
              entry.parameters.one_time
            )

          case "Sustained":
            return getFastSustainedPerformanceParametersTranslations(
              getSkillModificationLevelById,
              locale,
              Entity.LiturgicalChant,
              ResponsiveTextSize.Full,
              entry.parameters.sustained
            )

          default:
            return assertExhaustive(entry.parameters)
        }
      })()

      return {
        title: translation.name,
        className: "liturgical-chant",
        content: [
          getTextForCheck(
            { translate, translateMap, getAttributeById },
            entry.check,
            {
              value: entry.check_penalty,
              responsiveText: ResponsiveTextSize.Full,
              getSpirit,
              getToughness,
            }
          ),
          ...getTextForEffect(locale, translation.effect),
          {
            label: translate("Liturgical Time"),
            value:
              castingTime !== translation.casting_time.full
                ? `***${castingTime}*** (${translation.casting_time.full})`
                : castingTime,
          },
          {
            label: translate("KP Cost"),
            value:
              cost !== translation.cost.full
                ? `***${cost}*** (${translation.cost.full})`
                : cost,
          },
          {
            label: translate("Range"),
            value:
              range !== translation.range.full
                ? `***${range}*** (${translation.range.full})`
                : range,
          },
          {
            label: translate("Duration"),
            value:
              duration !== translation.duration.full
                ? `***${duration}*** (${translation.duration.full})`
                : duration,
          },
          getTargetCategoryTranslation(
            getTargetCategoryById,
            locale,
            entry.target
          ),
          getTextForTraditions(
            {
              translate,
              translateMap,
              localeCompare,
              getBlessedTraditionById,
              getAspectById,
            },
            entry.traditions
          ),
          createImprovementCost(translate, entry.improvement_cost),
        ],
        src: entry.src,
      }
    }
)

/**
 * Get a JSON representation of the rules text for a ceremony.
 */
export const getCeremonyLibraryEntry = createLibraryEntryCreator<
  Ceremony,
  {
    getAttributeById: GetById.Static.Attribute
    getSpirit: () => DerivedCharacteristic | undefined
    getToughness: () => DerivedCharacteristic | undefined
    getSkillModificationLevelById: GetById.Static.SkillModificationLevel
    getTargetCategoryById: GetById.Static.TargetCategory
    getBlessedTraditionById: GetById.Static.BlessedTradition
    getAspectById: GetById.Static.Aspect
  }
>(
  (
      entry,
      {
        getAttributeById,
        getSpirit,
        getToughness,
        getSkillModificationLevelById,
        getTargetCategoryById,
        getBlessedTraditionById,
        getAspectById,
      }
    ) =>
    (locale) => {
      const { translate, translateMap, compare: localeCompare } = locale
      const translation = translateMap(entry.translations)

      if (translation === undefined) {
        return undefined
      }

      const { castingTime, cost, range, duration } = (() => {
        switch (entry.parameters.tag) {
          case "OneTime":
            return getSlowOneTimePerformanceParametersTranslations(
              getSkillModificationLevelById,
              locale,
              Entity.Ritual,
              ResponsiveTextSize.Full,
              entry.parameters.one_time
            )

          case "Sustained":
            return getSlowSustainedPerformanceParametersTranslations(
              getSkillModificationLevelById,
              locale,
              Entity.Ceremony,
              ResponsiveTextSize.Full,
              entry.parameters.sustained
            )

          default:
            return assertExhaustive(entry.parameters)
        }
      })()

      return {
        title: translation.name,
        className: "ceremony",
        content: [
          getTextForCheck(
            { translate, translateMap, getAttributeById },
            entry.check,
            {
              value: entry.check_penalty,
              responsiveText: ResponsiveTextSize.Full,
              getSpirit,
              getToughness,
            }
          ),
          ...getTextForEffect(locale, translation.effect),
          {
            label: translate("Ceremonial Time"),
            value:
              castingTime !== translation.casting_time.full
                ? `***${castingTime}*** (${translation.casting_time.full})`
                : castingTime,
          },
          {
            label: translate("KP Cost"),
            value:
              cost !== translation.cost.full
                ? `***${cost}*** (${translation.cost.full})`
                : cost,
          },
          {
            label: translate("Range"),
            value:
              range !== translation.range.full
                ? `***${range}*** (${translation.range.full})`
                : range,
          },
          {
            label: translate("Duration"),
            value:
              duration !== translation.duration.full
                ? `***${duration}*** (${translation.duration.full})`
                : duration,
          },
          getTargetCategoryTranslation(
            getTargetCategoryById,
            locale,
            entry.target
          ),
          getTextForTraditions(
            {
              translate,
              translateMap,
              localeCompare,
              getBlessedTraditionById,
              getAspectById,
            },
            entry.traditions
          ),
          createImprovementCost(translate, entry.improvement_cost),
        ],
        src: entry.src,
      }
    }
)
