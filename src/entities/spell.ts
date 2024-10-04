import { Compare } from "@optolith/helpers/compare"
import { isNotNullish, mapNullable } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import { Cantrip } from "optolith-database-schema/types/Cantrip"
import { DerivedCharacteristic } from "optolith-database-schema/types/DerivedCharacteristic"
import { Ritual } from "optolith-database-schema/types/Ritual"
import { Spell } from "optolith-database-schema/types/Spell"
import {
  MagicalTraditionReference,
  PropertyReference,
} from "optolith-database-schema/types/_SimpleReferences"
import { Traditions } from "optolith-database-schema/types/_Spellwork"
import { GetById } from "../helpers/getTypes.js"
import { Translate, TranslateMap } from "../helpers/translate.js"
import {
  createLibraryEntryCreator,
  LibraryEntryContent,
} from "../libraryEntry.js"
import { getTextForCantripDuration } from "./partial/rated/activatable/duration.js"
import { getTextForEffect } from "./partial/rated/activatable/effect.js"
import { Entity } from "./partial/rated/activatable/entity.js"
import {
  getTextForFastOneTimePerformanceParameters,
  getTextForFastSustainedPerformanceParameters,
  getTextForSlowOneTimePerformanceParameters,
  getTextForSlowSustainedPerformanceParameters,
} from "./partial/rated/activatable/index.js"
import { parensIf } from "./partial/rated/activatable/parensIf.js"
import { getTextForCantripRange } from "./partial/rated/activatable/range.js"
import { getTextForTargetCategory } from "./partial/rated/activatable/targetCategory.js"
import { createImprovementCost } from "./partial/rated/improvementCost.js"
import { getTextForCheck } from "./partial/rated/skillCheck.js"
import { ResponsiveTextSize } from "./partial/responsiveText.js"

const getTextForProperty = (
  deps: {
    translate: Translate
    translateMap: TranslateMap
    getPropertyById: GetById.Static.Property
  },
  value: PropertyReference
): LibraryEntryContent => {
  const text = (() => {
    const staticEntry = deps.getPropertyById(value.id.property)
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
    getMagicalTraditionById: GetById.Static.MagicalTradition
  },
  value: Traditions
): LibraryEntryContent => {
  const text = (() => {
    switch (value.tag) {
      case "General":
        return deps.translate("General")
      case "Specific":
        return value.specific
          .map((trad) =>
            deps.translateMap(
              deps.getMagicalTraditionById(trad.magical_tradition)?.translations
            )
          )
          .filter(isNotNullish)
          .map((trad) => trad.name_for_arcane_spellworks ?? trad.name)
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
  ref: MagicalTraditionReference,
  getMagicalTraditionById: GetById.Static.MagicalTradition,
  translateMap: TranslateMap
) => {
  const translation = translateMap(
    getMagicalTraditionById(ref.id.magical_tradition)?.translations
  )
  return translation?.name_for_arcane_spellworks ?? translation?.name
}

/**
 * Get a JSON representation of the rules text for a cantrip.
 */
export const getCantripLibraryEntry = createLibraryEntryCreator<
  Cantrip,
  {
    getTargetCategoryById: GetById.Static.TargetCategory
    getPropertyById: GetById.Static.Property
    getMagicalTraditionById: GetById.Static.MagicalTradition
    getCurriculumById: GetById.Static.Curriculum
  }
>(
  (
      entry,
      {
        getTargetCategoryById,
        getPropertyById,
        getMagicalTraditionById,
        getCurriculumById,
      }
    ) =>
    ({ translate, translateMap, localeCompare }) => {
      const translation = translateMap(entry.translations)

      if (translation === undefined) {
        return undefined
      }

      const range = getTextForCantripRange(
        { translate },
        entry.parameters.range,
        {
          responsiveText: ResponsiveTextSize.Full,
        }
      )

      const duration = getTextForCantripDuration(
        { translate, translateMap },
        entry.parameters.duration,
        {
          responsiveText: ResponsiveTextSize.Full,
        }
      )

      return {
        title: translation.name,
        className: "cantrip",
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
          getTextForTargetCategory(
            { translate, translateMap, getTargetCategoryById },
            entry.target
          ),
          getTextForProperty(
            { translate, translateMap, getPropertyById },
            entry.property
          ),
          mapNullable(entry.note, (note) => ({
            label: translate("Note"),
            value: (() => {
              switch (note.tag) {
                case "Common":
                  return note.common.list
                    .map((academyOrTradition) => {
                      switch (academyOrTradition.tag) {
                        case "Academy":
                          return translateMap(
                            getCurriculumById(
                              academyOrTradition.academy.id.curriculum
                            )?.translations
                          )?.name
                        case "Tradition": {
                          return mapNullable(
                            getTraditionNameForArcaneSpellworksById(
                              academyOrTradition.tradition,
                              getMagicalTraditionById,
                              translateMap
                            ),
                            (name) =>
                              name +
                              parensIf(
                                translateMap(
                                  academyOrTradition.tradition.translations
                                )?.note
                              )
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
                  return note.exclusive.traditions
                    .map((tradition) =>
                      getTraditionNameForArcaneSpellworksById(
                        tradition,
                        getMagicalTraditionById,
                        translateMap
                      )
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
        src: entry.src,
      }
    }
)

/**
 * Get a JSON representation of the rules text for a skill.
 */
export const getSpellLibraryEntry = createLibraryEntryCreator<
  Spell,
  {
    getAttributeById: GetById.Static.Attribute
    getSpirit: () => DerivedCharacteristic | undefined
    getToughness: () => DerivedCharacteristic | undefined
    getSkillModificationLevelById: GetById.Static.SkillModificationLevel
    getTargetCategoryById: GetById.Static.TargetCategory
    getPropertyById: GetById.Static.Property
    getMagicalTraditionById: GetById.Static.MagicalTradition
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
        getPropertyById,
        getMagicalTraditionById,
      }
    ) =>
    ({ translate, translateMap, localeCompare }) => {
      const translation = translateMap(entry.translations)

      if (translation === undefined) {
        return undefined
      }

      const { castingTime, cost, range, duration } = (() => {
        switch (entry.parameters.tag) {
          case "OneTime":
            return getTextForFastOneTimePerformanceParameters(
              {
                getSkillModificationLevelById,
                translate,
                translateMap,
              },
              entry.parameters.one_time,
              {
                entity: Entity.Spell,
                responsiveText: ResponsiveTextSize.Full,
              }
            )

          case "Sustained":
            return getTextForFastSustainedPerformanceParameters(
              {
                getSkillModificationLevelById,
                translate,
                translateMap,
              },
              entry.parameters.sustained,
              {
                entity: Entity.Spell,
                responsiveText: ResponsiveTextSize.Full,
              }
            )

          default:
            return assertExhaustive(entry.parameters)
        }
      })()

      return {
        title: translation.name,
        className: "spell",
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
          ...getTextForEffect(translation.effect, translate),
          {
            label: translate("Casting Time"),
            value:
              castingTime !== translation.casting_time.full
                ? `***${castingTime}*** (${translation.casting_time.full})`
                : castingTime,
          },
          {
            label: translate("AE Cost"),
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
          getTextForTargetCategory(
            { translate, translateMap, getTargetCategoryById },
            entry.target
          ),
          getTextForProperty(
            { translate, translateMap, getPropertyById },
            entry.property
          ),
          getTextForTraditions(
            { translate, translateMap, localeCompare, getMagicalTraditionById },
            entry.traditions
          ),
          createImprovementCost(translate, entry.improvement_cost),
        ],
        src: entry.src,
      }
    }
)

/**
 * Get a JSON representation of the rules text for a ritual.
 */
export const getRitualLibraryEntry = createLibraryEntryCreator<
  Ritual,
  {
    getAttributeById: GetById.Static.Attribute
    getSpirit: () => DerivedCharacteristic | undefined
    getToughness: () => DerivedCharacteristic | undefined
    getSkillModificationLevelById: GetById.Static.SkillModificationLevel
    getTargetCategoryById: GetById.Static.TargetCategory
    getPropertyById: GetById.Static.Property
    getMagicalTraditionById: GetById.Static.MagicalTradition
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
        getPropertyById,
        getMagicalTraditionById,
      }
    ) =>
    ({ translate, translateMap, localeCompare }) => {
      const translation = translateMap(entry.translations)

      if (translation === undefined) {
        return undefined
      }

      const { castingTime, cost, range, duration } = (() => {
        switch (entry.parameters.tag) {
          case "OneTime":
            return getTextForSlowOneTimePerformanceParameters(
              {
                getSkillModificationLevelById,
                translate,
                translateMap,
              },
              entry.parameters.one_time,
              {
                entity: Entity.Ritual,
                responsiveText: ResponsiveTextSize.Full,
              }
            )

          case "Sustained":
            return getTextForSlowSustainedPerformanceParameters(
              {
                getSkillModificationLevelById,
                translate,
                translateMap,
              },
              entry.parameters.sustained,
              {
                entity: Entity.Ritual,
                responsiveText: ResponsiveTextSize.Full,
              }
            )

          default:
            return assertExhaustive(entry.parameters)
        }
      })()

      return {
        title: translation.name,
        className: "ritual",
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
          ...getTextForEffect(translation.effect, translate),
          {
            label: translate("Ritual Time"),
            value:
              castingTime !== translation.casting_time.full
                ? `***${castingTime}*** (${translation.casting_time.full})`
                : castingTime,
          },
          {
            label: translate("AE Cost"),
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
          getTextForTargetCategory(
            { translate, translateMap, getTargetCategoryById },
            entry.target
          ),
          getTextForProperty(
            { translate, translateMap, getPropertyById },
            entry.property
          ),
          getTextForTraditions(
            { translate, translateMap, localeCompare, getMagicalTraditionById },
            entry.traditions
          ),
          createImprovementCost(translate, entry.improvement_cost),
        ],
        src: entry.src,
      }
    }
)
