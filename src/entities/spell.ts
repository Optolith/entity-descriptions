import { Compare } from "@optolith/helpers/compare"
import { isNotNullish, mapNullable } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type {
  Cantrip,
  MagicalTradition_ID,
  Property_ID,
  Ritual,
  Spell,
  SpellworkTraditions,
} from "optolith-database-schema/gen"
import { createEntityDescriptionCreator } from "../creator.js"
import type { GetInstanceById } from "../helpers/getTypes.js"
import { Translate, TranslateMap } from "../helpers/translate.js"
import { EntityDescriptionSection, type IdMap } from "../index.js"
import { getDurationTranslationForCantrip } from "./partial/rated/activatable/duration.js"
import { getTextForEffect } from "./partial/rated/activatable/effect.js"
import { Entity } from "./partial/rated/activatable/entity.js"
import {
  getFastOneTimePerformanceParametersTranslations,
  getFastSustainedPerformanceParametersTranslations,
  getSlowOneTimePerformanceParametersTranslations,
  getSlowSustainedPerformanceParametersTranslations,
} from "./partial/rated/activatable/index.js"
import { parensIf } from "./partial/rated/activatable/parensIf.js"
import { getTextForCantripRange } from "./partial/rated/activatable/range.js"
import { getTargetCategoryTranslation } from "./partial/rated/activatable/targetCategory.js"
import { createImprovementCost } from "./partial/rated/improvementCost.js"
import { getTextForCheck } from "./partial/rated/skillCheck.js"
import { ResponsiveTextSize } from "./partial/responsiveText.js"

const getTextForProperty = (
  deps: {
    translate: Translate
    translateMap: TranslateMap
    getInstanceById: GetInstanceById<"Property">
  },
  id: Property_ID,
): EntityDescriptionSection => {
  const text = (() => {
    const staticEntry = deps.getInstanceById("Property", id)
    const staticEntryTranslation = deps.translateMap(staticEntry?.translations)

    if (staticEntryTranslation === undefined) {
      return ""
    }

    return staticEntryTranslation.name
  })()

  return {
    label: deps.translate("Property"),
    value: text,
  }
}

const getTextForTraditions = (
  deps: {
    translate: Translate
    translateMap: TranslateMap
    localeCompare: Compare<string>
    getInstanceById: GetInstanceById<"MagicalTradition">
  },
  value: SpellworkTraditions,
): EntityDescriptionSection => {
  const text = (() => {
    switch (value.kind) {
      case "General":
        return deps.translate("General")
      case "Specific":
        return value.Specific.map(trad =>
          deps.translateMap(
            deps.getInstanceById("MagicalTradition", trad)?.translations,
          ),
        )
          .filter(isNotNullish)
          .map(trad => trad.name_for_arcane_spellworks ?? trad.name)
          .sort(deps.localeCompare)
          .join(", ")
      default:
        return assertExhaustive(value)
    }
  })()

  return {
    label: deps.translate("Traditions"),
    value: text,
  }
}

const getTraditionNameForArcaneSpellworksById = (
  id: MagicalTradition_ID,
  getInstanceById: GetInstanceById<"MagicalTradition">,
  translateMap: TranslateMap,
) => {
  const translation = translateMap(
    getInstanceById("MagicalTradition", id)?.translations,
  )
  return translation?.name_for_arcane_spellworks ?? translation?.name
}

/**
 * Get a JSON representation of the rules text for a cantrip.
 */
export const getCantripEntityDescription = createEntityDescriptionCreator<
  Cantrip,
  {
    getInstanceById: GetInstanceById<
      "TargetCategory" | "Property" | "MagicalTradition" | "Curriculum"
    >
  }
>(({ getInstanceById }, locale, entry) => {
  const { translate, translateMap, compare: localeCompare } = locale
  const translation = translateMap(entry.translations)

  if (translation === undefined) {
    return undefined
  }

  const range = getTextForCantripRange(
    locale,
    ResponsiveTextSize.Full,
    entry.parameters.range,
  )

  const duration = getDurationTranslationForCantrip(
    locale,
    ResponsiveTextSize.Full,
    entry.parameters.duration,
  )

  return {
    title: translation.name,
    className: "cantrip",
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
      getTextForProperty(
        { translate, translateMap, getInstanceById },
        entry.property,
      ),
      mapNullable(entry.note, note => ({
        label: translate("Note"),
        value: (() => {
          switch (note.kind) {
            case "Common":
              return note.Common.list
                .map(academyOrTradition => {
                  switch (academyOrTradition.kind) {
                    case "Academy":
                      return translateMap(
                        getInstanceById(
                          "Curriculum",
                          academyOrTradition.Academy,
                        )?.translations,
                      )?.name
                    case "Tradition": {
                      return mapNullable(
                        getTraditionNameForArcaneSpellworksById(
                          academyOrTradition.Tradition.id,
                          getInstanceById,
                          translateMap,
                        ),
                        name =>
                          name +
                          parensIf(
                            translateMap(
                              academyOrTradition.Tradition.translations,
                            )?.note,
                          ),
                      )
                    }
                    default:
                      return assertExhaustive(academyOrTradition)
                  }
                })
                .filter(isNotNullish)
                .sort(localeCompare)
                .join(", ")

            case "Exclusive":
              return note.Exclusive.traditions
                .map(tradition =>
                  getTraditionNameForArcaneSpellworksById(
                    tradition,
                    getInstanceById,
                    translateMap,
                  ),
                )
                .filter(isNotNullish)
                .sort(localeCompare)
                .join(", ")

            default:
              return assertExhaustive(note)
          }
        })(),
      })),
    ],
    references: entry.src,
  }
})

/**
 * Get a JSON representation of the rules text for a skill.
 */
export const getSpellEntityDescription = createEntityDescriptionCreator<
  Spell,
  {
    getInstanceById: GetInstanceById<
      | "Attribute"
      | "SkillModificationLevel"
      | "TargetCategory"
      | "Property"
      | "MagicalTradition"
      | "DerivedCharacteristic"
    >
    idMap: IdMap
  }
>(({ getInstanceById, idMap }, locale, entry) => {
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
          Entity.Spell,
          ResponsiveTextSize.Full,
          entry.parameters.OneTime,
        )

      case "Sustained":
        return getFastSustainedPerformanceParametersTranslations(
          getInstanceById,
          locale,
          Entity.Spell,
          ResponsiveTextSize.Full,
          entry.parameters.Sustained,
        )

      default:
        return assertExhaustive(entry.parameters)
    }
  })()

  return {
    title: translation.name,
    className: "spell",
    body: [
      getTextForCheck(
        { translate, translateMap, getInstanceById },
        entry.check,
        {
          value: entry.check_penalty,
          responsiveText: ResponsiveTextSize.Full,
          getInstanceById,
          idMap,
        },
      ),
      ...getTextForEffect(locale, translation.effect),
      {
        label: translate("Casting Time"),
        value:
          translation.casting_time &&
          castingTime !== translation.casting_time.full
            ? `***${castingTime}*** (${translation.casting_time.full})`
            : castingTime,
      },
      {
        label: translate("AE Cost"),
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
      getTextForProperty(
        { translate, translateMap, getInstanceById },
        entry.property,
      ),
      getTextForTraditions(
        { translate, translateMap, localeCompare, getInstanceById },
        entry.traditions,
      ),
      createImprovementCost(translate, entry.improvement_cost),
    ],
    references: entry.src,
  }
})

/**
 * Get a JSON representation of the rules text for a ritual.
 */
export const getRitualEntityDescription = createEntityDescriptionCreator<
  Ritual,
  {
    getInstanceById: GetInstanceById<
      | "Attribute"
      | "SkillModificationLevel"
      | "TargetCategory"
      | "Property"
      | "MagicalTradition"
      | "DerivedCharacteristic"
    >
    idMap: IdMap
  }
>(({ getInstanceById, idMap }, locale, entry) => {
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
          Entity.Ritual,
          ResponsiveTextSize.Full,
          entry.parameters.Sustained,
        )

      default:
        return assertExhaustive(entry.parameters)
    }
  })()

  return {
    title: translation.name,
    className: "ritual",
    body: [
      getTextForCheck(
        { translate, translateMap, getInstanceById },
        entry.check,
        {
          value: entry.check_penalty,
          responsiveText: ResponsiveTextSize.Full,
          getInstanceById,
          idMap,
        },
      ),
      ...getTextForEffect(locale, translation.effect),
      {
        label: translate("Ritual Time"),
        value:
          translation.casting_time &&
          castingTime !== translation.casting_time.full
            ? `***${castingTime}*** (${translation.casting_time.full})`
            : castingTime,
      },
      {
        label: translate("AE Cost"),
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
      getTextForProperty(
        { translate, translateMap, getInstanceById },
        entry.property,
      ),
      getTextForTraditions(
        { translate, translateMap, localeCompare, getInstanceById },
        entry.traditions,
      ),
      createImprovementCost(translate, entry.improvement_cost),
    ],
    references: entry.src,
  }
})
