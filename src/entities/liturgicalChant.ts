import { Compare } from "@optolith/helpers/compare"
import { isNotNullish } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import {
  Blessing,
  type Ceremony,
  type DerivedCharacteristic,
  type LiturgicalChant,
  type LiturgyTradition,
} from "optolith-database-schema/gen"
import { createEntityDescriptionCreator } from "../creator.js"
import type { GetInstanceById } from "../helpers/getTypes.js"
import { Translate, TranslateMap } from "../helpers/translate.js"
import { EntityDescriptionSection } from "../index.js"
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
    getInstanceById: GetInstanceById<"BlessedTradition" | "Aspect">
  },
  values: LiturgyTradition[],
): EntityDescriptionSection => {
  const getAspectName = (aspectId: string) =>
    deps.translateMap(deps.getInstanceById("Aspect", aspectId)?.translations)
      ?.name

  const text = values
    .map(trad => {
      switch (trad.kind) {
        case "GeneralAspect":
          return getAspectName(trad.GeneralAspect)
        case "Tradition": {
          const traditionTranslation = deps.translateMap(
            deps.getInstanceById("BlessedTradition", trad.Tradition.tradition)
              ?.translations,
          )
          const name =
            traditionTranslation?.name_compressed ?? traditionTranslation?.name

          if (name === undefined) {
            return undefined
          }

          const aspects =
            trad.Tradition.aspects
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
export const getBlessingEntityDescription = createEntityDescriptionCreator<
  Blessing,
  {
    getInstanceById: GetInstanceById<"TargetCategory">
  }
>(({ getInstanceById }, locale, entry) => {
  const { translate, translateMap } = locale
  const translation = translateMap(entry.translations)

  if (translation === undefined) {
    return undefined
  }

  const range = getTextForBlessingRange(
    locale,
    ResponsiveTextSize.Full,
    entry.parameters.range,
  )

  const duration = getDurationTranslationForBlessing(
    locale,
    ResponsiveTextSize.Full,
    entry.parameters.duration,
  )

  return {
    title: translation.name,
    className: "blessing",
    body: [
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
      getTargetCategoryTranslation(getInstanceById, locale, entry.target),
    ],
    references: entry.src,
  }
})

/**
 * Get a JSON representation of the rules text for a liturgical chant.
 */
export const getLiturgicalChantEntityDescription =
  createEntityDescriptionCreator<
    LiturgicalChant,
    {
      getInstanceById: GetInstanceById<
        | "Attribute"
        | "SkillModificationLevel"
        | "TargetCategory"
        | "Aspect"
        | "BlessedTradition"
      >
      getSpirit: () => DerivedCharacteristic | undefined
      getToughness: () => DerivedCharacteristic | undefined
    }
  >(({ getInstanceById, getSpirit, getToughness }, locale, entry) => {
    const { translate, translateMap, compare: localeCompare } = locale
    const translation = translateMap(entry.translations)

    if (translation === undefined) {
      return undefined
    }

    const { castingTime, cost, range, duration } = (() => {
      switch (entry.parameters.kind) {
        case "OneTime":
          return getFastOneTimePerformanceParametersTranslations(
            getInstanceById,
            locale,
            Entity.LiturgicalChant,
            ResponsiveTextSize.Full,
            entry.parameters.OneTime,
          )

        case "Sustained":
          return getFastSustainedPerformanceParametersTranslations(
            getInstanceById,
            locale,
            Entity.LiturgicalChant,
            ResponsiveTextSize.Full,
            entry.parameters.Sustained,
          )

        default:
          return assertExhaustive(entry.parameters)
      }
    })()

    return {
      title: translation.name,
      className: "liturgical-chant",
      body: [
        getTextForCheck(
          { translate, translateMap, getInstanceById },
          entry.check,
          {
            value: entry.check_penalty,
            responsiveText: ResponsiveTextSize.Full,
            getSpirit,
            getToughness,
          },
        ),
        ...getTextForEffect(locale, translation.effect),
        {
          label: translate("Liturgical Time"),
          value:
            translation.casting_time &&
            castingTime !== translation.casting_time.full
              ? `***${castingTime}*** (${translation.casting_time.full})`
              : castingTime,
        },
        {
          label: translate("KP Cost"),
          value:
            translation.cost && cost !== translation.cost.full
              ? `***${cost}*** (${translation.cost.full})`
              : cost,
        },
        {
          label: translate("Range"),
          value:
            translation.range && range !== translation.range.full
              ? `***${range}*** (${translation.range.full})`
              : range,
        },
        {
          label: translate("Duration"),
          value:
            translation.duration && duration !== translation.duration.full
              ? `***${duration}*** (${translation.duration.full})`
              : duration,
        },
        getTargetCategoryTranslation(getInstanceById, locale, entry.target),
        getTextForTraditions(
          {
            translate,
            translateMap,
            localeCompare,
            getInstanceById,
          },
          entry.traditions,
        ),
        createImprovementCost(translate, entry.improvement_cost),
      ],
      references: entry.src,
    }
  })

/**
 * Get a JSON representation of the rules text for a ceremony.
 */
export const getCeremonyEntityDescription = createEntityDescriptionCreator<
  Ceremony,
  {
    getInstanceById: GetInstanceById<
      | "Attribute"
      | "SkillModificationLevel"
      | "TargetCategory"
      | "Aspect"
      | "BlessedTradition"
    >
    getSpirit: () => DerivedCharacteristic | undefined
    getToughness: () => DerivedCharacteristic | undefined
  }
>(({ getInstanceById, getSpirit, getToughness }, locale, entry) => {
  const { translate, translateMap, compare: localeCompare } = locale
  const translation = translateMap(entry.translations)

  if (translation === undefined) {
    return undefined
  }

  const { castingTime, cost, range, duration } = (() => {
    switch (entry.parameters.kind) {
      case "OneTime":
        return getSlowOneTimePerformanceParametersTranslations(
          getInstanceById,
          locale,
          Entity.Ritual,
          ResponsiveTextSize.Full,
          entry.parameters.OneTime,
        )

      case "Sustained":
        return getSlowSustainedPerformanceParametersTranslations(
          getInstanceById,
          locale,
          Entity.Ceremony,
          ResponsiveTextSize.Full,
          entry.parameters.Sustained,
        )

      default:
        return assertExhaustive(entry.parameters)
    }
  })()

  return {
    title: translation.name,
    className: "ceremony",
    body: [
      getTextForCheck(
        { translate, translateMap, getInstanceById },
        entry.check,
        {
          value: entry.check_penalty,
          responsiveText: ResponsiveTextSize.Full,
          getSpirit,
          getToughness,
        },
      ),
      ...getTextForEffect(locale, translation.effect),
      {
        label: translate("Ceremonial Time"),
        value:
          translation.casting_time &&
          castingTime !== translation.casting_time.full
            ? `***${castingTime}*** (${translation.casting_time.full})`
            : castingTime,
      },
      {
        label: translate("KP Cost"),
        value:
          translation.cost && cost !== translation.cost.full
            ? `***${cost}*** (${translation.cost.full})`
            : cost,
      },
      {
        label: translate("Range"),
        value:
          translation.range && range !== translation.range.full
            ? `***${range}*** (${translation.range.full})`
            : range,
      },
      {
        label: translate("Duration"),
        value:
          translation.duration && duration !== translation.duration.full
            ? `***${duration}*** (${translation.duration.full})`
            : duration,
      },
      getTargetCategoryTranslation(getInstanceById, locale, entry.target),
      getTextForTraditions(
        {
          translate,
          translateMap,
          localeCompare,
          getInstanceById,
        },
        entry.traditions,
      ),
      createImprovementCost(translate, entry.improvement_cost),
    ],
    references: entry.src,
  }
})
