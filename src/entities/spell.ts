import { ensureNonEmpty } from "@elyukai/utils/array/nonEmpty"
import { on } from "@elyukai/utils/function"
import { Lazy } from "@elyukai/utils/lazy"
import { compareNullish } from "@elyukai/utils/ordering"
import { Reader } from "@elyukai/utils/reader"
import { romanize } from "@elyukai/utils/roman"
import { Compare, numAsc } from "@optolith/helpers/compare"
import { isNotNullish, mapNullable } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import {
  type ActivatableSkillEffect,
  type AnimistPowerImprovementCost,
  type AnimistPowerPerformanceParameters,
  type ArcaneBardTraditionReference,
  type ArcaneDancerTraditionReference,
  type FamiliarsTrickPerformanceParameters,
  type FamiliarsTrickProperty,
  type MagicalRuneCost,
  type MagicalRuneCraftingTime,
  type MagicalRuneDuration,
  type MagicalRuneImprovementCost,
  type MagicalRuneOption,
  type MagicalTradition_ID,
  type OldParameterBySpeed,
  type Property_ID,
  type ResponsiveTextOptional,
  type SpellworkTraditions,
  type Tribe_ID,
} from "optolith-database-schema/gen"
import { Case } from "tsondb/schema/gen"
import { createEntityDescriptionCreator } from "../creator.js"
import type {
  GetAllChildInstancesForParent,
  GetInstanceById,
} from "../helpers/getTypes.js"
import type { LocaleCompare } from "../helpers/locale.js"
import {
  Translate,
  TranslateMap,
  type TranslationKeysWithoutParams,
} from "../helpers/translate.js"
import {
  type IdMap,
  type RawDefinitionListEntityDescriptionSectionItem,
} from "../index.js"
import { renderAnimalTypesSection } from "./partial/animalTypes.js"
import {
  printAnimistPowerPrerequisites,
  printGeodeRitualPrerequisites,
} from "./partial/prerequisites/index.js"
import {
  renderCastingTime,
  renderFastSkillNonModifiableCastingTime,
  renderSlowSkillNonModifiableCastingTime,
} from "./partial/rated/activatable/castingTime.js"
import {
  renderMagicalActionCost,
  renderModifiableOneTimeCost,
  renderNonModifiableOneTimeCost,
} from "./partial/rated/activatable/cost.js"
import {
  renderCheckResultBasedDuration,
  renderMusicDuration,
  renderOneTimeDuration,
  renderSustainedDuration,
} from "./partial/rated/activatable/duration.js"
import { renderEffect } from "./partial/rated/activatable/effect.js"
import {
  renderFastPerformanceParameters,
  renderSlowOneTimePerformanceParameters,
  renderSlowPerformanceParameters,
} from "./partial/rated/activatable/index.js"
import { ModifiableParameter } from "./partial/rated/activatable/nonModifiableSuffix.js"
import { parensIf } from "./partial/rated/activatable/parensIf.js"
import { renderNonModifiableRange } from "./partial/rated/activatable/range.js"
import { Speed } from "./partial/rated/activatable/speed.js"
import { renderTargetCategory } from "./partial/rated/activatable/targetCategory.js"
import {
  renderImprovementCost,
  renderImprovementCostValue,
} from "./partial/rated/improvementCost.js"
import {
  renderSkillCheck,
  renderSkillCheckWithPenalty,
} from "./partial/rated/skillCheck.js"
import {
  formatEnergyR,
  localeJoinR,
  responsiveR,
  responsiveTextR,
  responsiveTranslateR,
  translateMapR,
  translateR,
  type EnvMap,
  type StdEnv,
  type StdReader,
} from "./partial/reader.js"
import {
  appendNoteIfNeeded,
  getResponsiveText,
  ResponsiveTextSize,
} from "./partial/responsiveText.js"
import { formatTimeSpanR, type TimeSpanUnit } from "./partial/units/timeSpan.js"
import { MISSING_VALUE } from "./partial/unknown.js"

const combineGeneratedTextWithStaticTranslation = (
  label: string,
  generatedText: string | undefined,
  staticText: ResponsiveTextOptional | string | undefined,
): RawDefinitionListEntityDescriptionSectionItem | undefined => {
  if (generatedText === undefined) {
    return undefined
  }

  const normalizedStaticText =
    typeof staticText === "string" ? staticText : staticText?.full

  return {
    label,
    value:
      normalizedStaticText !== undefined &&
      generatedText !== normalizedStaticText
        ? `***${generatedText}*** (${normalizedStaticText})`
        : generatedText,
  }
}

const renderProperty = (
  id: Property_ID,
): StdReader<
  RawDefinitionListEntityDescriptionSectionItem,
  "t" | "tm" | "ibi",
  "Property"
> =>
  Reader.asks(({ translate, translateMap, getInstanceById }) => {
    const text = (() => {
      const staticEntry = getInstanceById("Property", id)
      const staticEntryTranslation = translateMap(staticEntry?.translations)

      if (staticEntryTranslation === undefined) {
        return ""
      }

      return staticEntryTranslation.name
    })()

    return {
      label: translate("Property"),
      value: text,
    }
  })

const getTextForTraditions = (
  deps: {
    translate: Translate
    translateMap: TranslateMap
    localeCompare: Compare<string>
    getInstanceById: GetInstanceById<"MagicalTradition">
  },
  value: SpellworkTraditions,
): RawDefinitionListEntityDescriptionSectionItem => {
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
  "Cantrip",
  {
    getInstanceById: GetInstanceById<
      | "Publication"
      | "TargetCategory"
      | "Property"
      | "MagicalTradition"
      | "Curriculum"
    >
  }
>(({ getInstanceById }, locale, { content: entry }) => {
  const { translate, translateMap, compare: localeCompare } = locale
  const translation = translateMap(entry.translations)

  if (translation === undefined) {
    return undefined
  }

  const env = {
    translate,
    translateMap,
    getInstanceById,
    responsiveTextSize: ResponsiveTextSize.Full,
  } satisfies Partial<EnvMap>

  const range = renderNonModifiableRange(entry.parameters.range, false).run(env)
  const duration = renderOneTimeDuration(entry.parameters.duration).run(env)

  return {
    title: translation.name,
    className: "cantrip",
    body: [
      {
        type: "definitionList",
        items: [
          {
            label: translate("Effect"),
            value: translation.effect,
          },
          combineGeneratedTextWithStaticTranslation(
            translate("Range"),
            range,
            translation.range,
          ),
          combineGeneratedTextWithStaticTranslation(
            translate("Duration"),
            duration,
            translation.duration,
          ),
          renderTargetCategory(entry.target).run(env),
          renderProperty(entry.property).run(env),
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
      },
    ],
    errata: translation.errata,
    references: entry.src,
  }
})

/**
 * Get a JSON representation of the rules text for a skill.
 */
export const getSpellEntityDescription = createEntityDescriptionCreator<
  "Spell",
  {
    getInstanceById: GetInstanceById<
      | "Publication"
      | "Attribute"
      | "SkillModificationLevel"
      | "TargetCategory"
      | "Property"
      | "MagicalTradition"
      | "DerivedCharacteristic"
    >
    idMap: IdMap
  }
>(({ getInstanceById, idMap }, locale, { content: entry }) => {
  const { translate, translateMap, compare: localeCompare } = locale
  const translation = translateMap(entry.translations)

  if (translation === undefined) {
    return undefined
  }

  const env = {
    translate,
    translateMap,
    getInstanceById,
    localeJoin: locale.join,
    energyUnit: "ArcaneEnergy",
    responsiveTextSize: ResponsiveTextSize.Full,
    nonModifiableSuffix: (
      param: ModifiableParameter,
    ): TranslationKeysWithoutParams => {
      switch (param) {
        case ModifiableParameter.CastingTime:
          return " (you cannot use a modification on this spell’s casting time)"
        case ModifiableParameter.Cost:
          return " (you cannot use a modification on this spell’s cost)"
        case ModifiableParameter.Range:
          return " (you cannot use a modification on this spell’s range)"
        default:
          return assertExhaustive(param)
      }
    },
  } satisfies Partial<EnvMap>

  const { castingTime, cost, range, duration } =
    renderFastPerformanceParameters(entry.parameters).run(env)

  return {
    title: translation.name,
    className: "spell",
    body: [
      {
        type: "definitionList",
        items: [
          renderSkillCheckWithPenalty(
            entry.check,
            entry.check_penalty,
            idMap,
          ).run(env),
          renderEffect(translation.effect).run(env),
          combineGeneratedTextWithStaticTranslation(
            translate("Casting Time"),
            castingTime,
            translation.casting_time,
          ),
          combineGeneratedTextWithStaticTranslation(
            translate("AE Cost"),
            cost,
            translation.cost,
          ),
          combineGeneratedTextWithStaticTranslation(
            translate("Range"),
            range,
            translation.range,
          ),
          combineGeneratedTextWithStaticTranslation(
            translate("Duration"),
            duration,
            translation.duration,
          ),
          renderTargetCategory(entry.target).run(env),
          renderProperty(entry.property).run(env),
          getTextForTraditions(
            { translate, translateMap, localeCompare, getInstanceById },
            entry.traditions,
          ),
          renderImprovementCost(entry.improvement_cost).run(env),
        ],
      },
    ],
    errata: translation.errata,
    references: entry.src,
  }
})

/**
 * Get a JSON representation of the rules text for a ritual.
 */
export const getRitualEntityDescription = createEntityDescriptionCreator<
  "Ritual",
  {
    getInstanceById: GetInstanceById<
      | "Publication"
      | "Attribute"
      | "SkillModificationLevel"
      | "TargetCategory"
      | "Property"
      | "MagicalTradition"
      | "DerivedCharacteristic"
    >
    idMap: IdMap
  }
>(({ getInstanceById, idMap }, locale, { content: entry }) => {
  const { translate, translateMap, compare: localeCompare } = locale
  const translation = translateMap(entry.translations)

  if (translation === undefined) {
    return undefined
  }

  const env = {
    translate,
    translateMap,
    getInstanceById,
    localeJoin: locale.join,
    energyUnit: "ArcaneEnergy",
    responsiveTextSize: ResponsiveTextSize.Full,
    nonModifiableSuffix: (
      param: ModifiableParameter,
    ): TranslationKeysWithoutParams => {
      switch (param) {
        case ModifiableParameter.CastingTime:
          return " (you cannot use a modification on this ritual’s ritual time)"
        case ModifiableParameter.Cost:
          return " (you cannot use a modification on this ritual’s cost)"
        case ModifiableParameter.Range:
          return " (you cannot use a modification on this ritual’s range)"
        default:
          return assertExhaustive(param)
      }
    },
  } satisfies Partial<EnvMap>

  const { castingTime, cost, range, duration } =
    renderSlowPerformanceParameters(entry.parameters).run(env)

  return {
    title: translation.name,
    className: "ritual",
    body: [
      {
        type: "definitionList",
        items: [
          renderSkillCheckWithPenalty(
            entry.check,
            entry.check_penalty,
            idMap,
          ).run(env),
          renderEffect(translation.effect).run(env),
          combineGeneratedTextWithStaticTranslation(
            translate("Ritual Time"),
            castingTime,
            translation.casting_time,
          ),
          combineGeneratedTextWithStaticTranslation(
            translate("AE Cost"),
            cost,
            translation.cost,
          ),
          combineGeneratedTextWithStaticTranslation(
            translate("Range"),
            range,
            translation.range,
          ),
          combineGeneratedTextWithStaticTranslation(
            translate("Duration"),
            duration,
            translation.duration,
          ),
          renderTargetCategory(entry.target).run(env),
          renderProperty(entry.property).run(env),
          getTextForTraditions(
            { translate, translateMap, localeCompare, getInstanceById },
            entry.traditions,
          ),
          renderImprovementCost(entry.improvement_cost).run(env),
        ],
      },
    ],
    errata: translation.errata,
    references: entry.src,
  }
})

/**
 * Get a JSON representation of the rules text for a curse.
 */
export const getCurseEntityDescription = createEntityDescriptionCreator<
  "Curse",
  {
    getInstanceById: GetInstanceById<
      "Publication" | "Attribute" | "Property" | "DerivedCharacteristic"
    >
    idMap: IdMap
  }
>(({ getInstanceById, idMap }, locale, { content: entry }) => {
  const { translate, translateMap } = locale
  const translation = translateMap(entry.translations)

  if (translation === undefined) {
    return undefined
  }

  const env = {
    translate,
    translateMap,
    getInstanceById,
    localeJoin: locale.join,
    energyUnit: "ArcaneEnergy",
    responsiveTextSize: ResponsiveTextSize.Full,
  } satisfies Partial<EnvMap>

  const cost = renderMagicalActionCost(entry.parameters.cost).run(env)
  const duration = renderOneTimeDuration(entry.parameters.duration).run(env)

  return {
    title: translation.name,
    className: "curse",
    body: [
      {
        type: "definitionList",
        items: [
          renderSkillCheckWithPenalty(
            entry.check,
            entry.check_penalty,
            idMap,
          ).run(env),
          renderEffect(translation.effect).run(env),
          combineGeneratedTextWithStaticTranslation(
            translate("AE Cost"),
            cost,
            translation.cost,
          ),
          combineGeneratedTextWithStaticTranslation(
            translate("Duration"),
            duration,
            translation.duration,
          ),
          renderProperty(entry.property).run(env),
          {
            label: translate("Improvement Cost"),
            value: "B",
          },
        ],
      },
    ],
    errata: translation.errata,
    references: entry.src,
  }
})

const renderMagicalActionSkill = (
  skill: string[],
): StdReader<
  RawDefinitionListEntityDescriptionSectionItem,
  "t" | "tm" | "lc" | "lj" | "ibi",
  "Skill"
> =>
  Reader.asks(
    ({
      translate,
      translateMap,
      localeCompare,
      localeJoin,
      getInstanceById,
    }) => ({
      label: translate("Skill"),
      value: localeJoin(
        skill
          .map(
            id =>
              translateMap(getInstanceById("Skill", id)?.translations)?.name ??
              MISSING_VALUE,
          )
          .toSorted(localeCompare),
        "disjunction",
      ),
    }),
  )

/**
 * Get a JSON representation of the rules text for an Elven magical song.
 */
export const getElvenMagicalSongEntityDescription =
  createEntityDescriptionCreator<
    "ElvenMagicalSong",
    {
      getInstanceById: GetInstanceById<
        | "Publication"
        | "Attribute"
        | "Property"
        | "DerivedCharacteristic"
        | "Skill"
      >
      idMap: IdMap
    }
  >(({ getInstanceById, idMap }, locale, { content: entry }) => {
    const { translate, translateMap } = locale
    const translation = translateMap(entry.translations)

    if (translation === undefined) {
      return undefined
    }

    const env = {
      translate,
      translateMap,
      getInstanceById,
      localeJoin: locale.join,
      localeCompare: locale.compare,
      energyUnit: "ArcaneEnergy",
      responsiveTextSize: ResponsiveTextSize.Full,
    } satisfies Partial<EnvMap>

    const cost = renderNonModifiableOneTimeCost(
      entry.parameters.cost,
      false,
    ).run(env)

    return {
      title: translation.name,
      className: "elven-magical-song",
      body: [
        {
          type: "definitionList",
          items: [
            renderSkillCheckWithPenalty(
              entry.check,
              entry.check_penalty,
              idMap,
            ).run(env),
            renderEffect(translation.effect).run(env),
            renderMagicalActionSkill(entry.skill).run(env),
            combineGeneratedTextWithStaticTranslation(
              translate("AE Cost"),
              cost,
              translation.cost,
            ),
            renderProperty(entry.property).run(env),
            renderImprovementCost(entry.improvement_cost).run(env),
          ],
        },
      ],
      errata: translation.errata,
      references: entry.src,
    }
  })

/**
 * Get a JSON representation of the rules text for a domination ritual.
 */
export const getDominationRitualEntityDescription =
  createEntityDescriptionCreator<
    "DominationRitual",
    {
      getInstanceById: GetInstanceById<
        | "Publication"
        | "Attribute"
        | "Property"
        | "DerivedCharacteristic"
        | "SkillModificationLevel"
      >
      idMap: IdMap
    }
  >(({ getInstanceById, idMap }, locale, { content: entry }) => {
    const { translate, translateMap } = locale
    const translation = translateMap(entry.translations)

    if (translation === undefined) {
      return undefined
    }

    const env = {
      translate,
      translateMap,
      getInstanceById,
      speed: Speed.Slow,
      energyUnit: "ArcaneEnergy",
      responsiveTextSize: ResponsiveTextSize.Full,
    } satisfies Partial<EnvMap>

    const cost = renderModifiableOneTimeCost(entry.parameters.cost).run(env)
    const duration = renderOneTimeDuration(entry.parameters.duration).run(env)

    return {
      title: translation.name,
      className: "domination-ritual",
      body: [
        {
          type: "definitionList",
          items: [
            renderSkillCheckWithPenalty(
              entry.check,
              entry.check_penalty,
              idMap,
            ).run(env),
            renderEffect(translation.effect).run(env),
            combineGeneratedTextWithStaticTranslation(
              translate("AE Cost"),
              cost,
              translation.cost,
            ),
            combineGeneratedTextWithStaticTranslation(
              translate("Duration"),
              duration,
              translation.duration,
            ),
            renderProperty(entry.property).run(env),
            {
              label: translate("Improvement Cost"),
              value: "B",
            },
          ],
        },
      ],
      errata: translation.errata,
      references: entry.src,
    }
  })

const renderMusicTradition = (
  translate: Translate,
  translateMap: TranslateMap,
  localeCompare: LocaleCompare,
  getInstanceById: GetInstanceById<
    "ArcaneBardTradition" | "ArcaneDancerTradition"
  >,
  entity: "ArcaneBardTradition" | "ArcaneDancerTradition",
  musicTraditions:
    | ArcaneBardTraditionReference[]
    | ArcaneDancerTraditionReference[],
): RawDefinitionListEntityDescriptionSectionItem => ({
  label: translate("Music Tradition"),
  value:
    ensureNonEmpty(
      musicTraditions
        .map(
          trad =>
            translateMap(getInstanceById(entity, trad.id)?.translations)?.name,
        )
        .filter(isNotNullish)
        .toSorted(localeCompare),
    )?.join(", ") ?? MISSING_VALUE,
})

/**
 * Get a JSON representation of the rules text for a magical dance.
 */
export const getMagicalDanceEntityDescription = createEntityDescriptionCreator<
  "MagicalDance",
  {
    getInstanceById: GetInstanceById<
      | "Publication"
      | "Attribute"
      | "Property"
      | "DerivedCharacteristic"
      | "ArcaneBardTradition"
      | "ArcaneDancerTradition"
    >
  }
>(({ getInstanceById }, locale, { content: entry }) => {
  const { translate, translateMap } = locale
  const translation = translateMap(entry.translations)

  if (translation === undefined) {
    return undefined
  }

  const env = {
    translate,
    translateMap,
    getInstanceById,
    localeJoin: locale.join,
    energyUnit: "ArcaneEnergy",
    responsiveTextSize: ResponsiveTextSize.Full,
  } satisfies Partial<EnvMap>

  const duration = renderMusicDuration(entry.parameters.duration).run(env)
  const cost = renderMagicalActionCost(entry.parameters.cost).run(env)

  return {
    title: translation.name,
    className: "magical-dance",
    body: [
      {
        type: "definitionList",
        items: [
          renderSkillCheck(entry.check).run(env),
          renderEffect(translation.effect).run(env),
          combineGeneratedTextWithStaticTranslation(
            translate("Duration"),
            duration,
            translation.duration,
          ),
          combineGeneratedTextWithStaticTranslation(
            translate("AE Cost"),
            cost,
            translation.cost,
          ),
          renderProperty(entry.property).run(env),
          renderMusicTradition(
            translate,
            translateMap,
            locale.compare,
            getInstanceById,
            "ArcaneDancerTradition",
            entry.music_tradition,
          ),
          renderImprovementCost(entry.improvement_cost).run(env),
        ],
      },
    ],
    errata: translation.errata,
    references: entry.src,
  }
})

/**
 * Get a JSON representation of the rules text for a magical melody.
 */
export const getMagicalMelodyEntityDescription = createEntityDescriptionCreator<
  "MagicalMelody",
  {
    getInstanceById: GetInstanceById<
      | "Publication"
      | "Attribute"
      | "Property"
      | "DerivedCharacteristic"
      | "Skill"
      | "ArcaneBardTradition"
      | "ArcaneDancerTradition"
    >
  }
>(({ getInstanceById }, locale, { content: entry }) => {
  const { translate, translateMap } = locale
  const translation = translateMap(entry.translations)

  if (translation === undefined) {
    return undefined
  }

  const env = {
    translate,
    translateMap,
    getInstanceById,
    localeCompare: locale.compare,
    localeJoin: locale.join,
    energyUnit: "ArcaneEnergy",
    responsiveTextSize: ResponsiveTextSize.Full,
  } satisfies Partial<EnvMap>

  const duration = renderMusicDuration(entry.parameters.duration).run(env)
  const cost = renderMagicalActionCost(entry.parameters.cost).run(env)

  return {
    title: translation.name,
    className: "magical-dance",
    body: [
      {
        type: "definitionList",
        items: [
          renderSkillCheck(entry.check).run(env),
          renderEffect(translation.effect).run(env),
          combineGeneratedTextWithStaticTranslation(
            translate("Duration"),
            duration,
            translation.duration,
          ),
          renderMagicalActionSkill(entry.skill).run(env),
          combineGeneratedTextWithStaticTranslation(
            translate("AE Cost"),
            cost,
            translation.cost,
          ),
          renderProperty(entry.property).run(env),
          renderMusicTradition(
            translate,
            translateMap,
            locale.compare,
            getInstanceById,
            "ArcaneBardTradition",
            entry.music_tradition,
          ),
          renderImprovementCost(entry.improvement_cost).run(env),
        ],
      },
    ],
    errata: translation.errata,
    references: entry.src,
  }
})

const renderFamiliarsTrickProperty = (
  translateMap: TranslateMap,
  getInstanceById: GetInstanceById<"Property">,
  responsiveTextSize: ResponsiveTextSize,
  property: FamiliarsTrickProperty,
) => {
  switch (property.kind) {
    case "Fixed":
      return (
        translateMap(getInstanceById("Property", property.Fixed)?.translations)
          ?.name ?? MISSING_VALUE
      )
    case "Indefinite":
      return getResponsiveText(
        translateMap(property.Indefinite.translations)?.description,
        responsiveTextSize,
      )
    default:
      return assertExhaustive(property)
  }
}

const renderFamiliarsTrickPerformanceParameters = (
  params: FamiliarsTrickPerformanceParameters,
): StdReader<
  {
    cost: string
    duration: string
  },
  "t" | "tm" | "rts" | "eu" | "nms" | "lj"
> => {
  switch (params.kind) {
    case "OneTime":
      return renderMagicalActionCost(params.OneTime.cost).then(cost =>
        renderOneTimeDuration(params.OneTime.duration).map(duration => ({
          cost,
          duration,
        })),
      )
    case "OneTimeInterval":
      return renderNonModifiableOneTimeCost(
        params.OneTimeInterval.cost,
        false,
      ).then(cost =>
        translateR("depends on spent AE").map(duration => ({
          cost,
          duration,
        })),
      )
    case "Sustained":
      return renderNonModifiableOneTimeCost(params.Sustained.cost, false).then(
        cost =>
          renderSustainedDuration(undefined).map(duration => ({
            cost,
            duration,
          })),
      )
    default:
      return assertExhaustive(params)
  }
}

/**
 * Get a JSON representation of the rules text for a familiar’s trick.
 */
export const getFamiliarsTrickEntityDescription =
  createEntityDescriptionCreator<
    "FamiliarsTrick",
    {
      getInstanceById: GetInstanceById<
        | "Publication"
        | "Attribute"
        | "Property"
        | "DerivedCharacteristic"
        | "AnimalType"
      >
    }
  >(({ getInstanceById }, locale, { content: entry }) => {
    const { translate, translateMap } = locale
    const translation = translateMap(entry.translations)

    if (translation === undefined) {
      return undefined
    }

    const env = {
      translate,
      translateMap,
      getInstanceById,
      localeJoin: locale.join,
      energyUnit: "ArcaneEnergy",
      responsiveTextSize: ResponsiveTextSize.Full,
    } satisfies Partial<EnvMap>

    const { cost, duration } = renderFamiliarsTrickPerformanceParameters(
      entry.parameters,
    ).run(env)

    return {
      title: translation.name,
      className: "magical-dance",
      body: [
        {
          type: "definitionList",
          items: [
            {
              label: locale.translate("Effect"),
              value: translation.effect,
            },
            renderAnimalTypesSection(
              translate,
              translateMap,
              locale.compare,
              getInstanceById,
              entry.animal_types,
            ),
            combineGeneratedTextWithStaticTranslation(
              translate("AE Cost"),
              cost,
              translation.cost,
            ),
            combineGeneratedTextWithStaticTranslation(
              translate("Duration"),
              duration,
              translation.duration,
            ),
            {
              label: translate("Property"),
              value: renderFamiliarsTrickProperty(
                translateMap,
                getInstanceById,
                ResponsiveTextSize.Full,
                entry.property,
              ),
            },
            {
              label: translate("AP Value"),
              value:
                entry.ap_value === undefined
                  ? translate("All familiars know this trick by default.")
                  : translate(
                      ".input {$value :number} {{{$value} Adventure Points}}",
                      { value: entry.ap_value },
                    ),
            },
          ],
        },
      ],
      errata: translation.errata,
      references: entry.src,
    }
  })

const renderAnimistPowerPerformanceParameters = (
  params: AnimistPowerPerformanceParameters,
): StdReader<
  {
    cost: string
    duration: string
  },
  "t" | "tm" | "rts" | "eu" | "nms" | "lj"
> => {
  switch (params.kind) {
    case "OneTime":
      return renderMagicalActionCost(params.OneTime.cost).then(cost =>
        renderOneTimeDuration(params.OneTime.duration).map(duration => ({
          cost,
          duration,
        })),
      )
    case "Sustained":
      return renderMagicalActionCost(params.Sustained.cost).then(cost =>
        renderSustainedDuration(undefined).map(duration => ({
          cost,
          duration,
        })),
      )
    default:
      return assertExhaustive(params)
  }
}

const renderAnimistPowerTribeTradition = (
  translate: Translate,
  translateMap: TranslateMap,
  localeCompare: LocaleCompare,
  getInstanceById: GetInstanceById<"Tribe">,
  tribeTradition: Tribe_ID[],
): string => {
  if (tribeTradition.length === 0) {
    return translate("General")
  }

  return (
    ensureNonEmpty(
      tribeTradition
        .map(
          id => translateMap(getInstanceById("Tribe", id)?.translations)?.name,
        )
        .filter(isNotNullish)
        .toSorted(localeCompare),
    )?.join(", ") ?? MISSING_VALUE
  )
}

const renderAnimistPowerImprovementCost = (
  improvementCost: AnimistPowerImprovementCost,
): StdReader<RawDefinitionListEntityDescriptionSectionItem, "t"> => {
  switch (improvementCost.kind) {
    case "Fixed":
      return renderImprovementCost(improvementCost.Fixed)
    case "ByPrimaryPatron":
      return Reader.asks(({ translate }) => ({
        label: translate("Improvement Cost"),
        value: translate("Depends on animal type"),
      }))
    default:
      return assertExhaustive(improvementCost)
  }
}

/**
 * Get a JSON representation of the rules text for a animist power.
 */
export const getAnimistPowerEntityDescription = createEntityDescriptionCreator<
  "AnimistPower",
  {
    getInstanceById: GetInstanceById<
      | "Publication"
      | "Attribute"
      | "SkillModificationLevel"
      | "TargetCategory"
      | "Property"
      | "MagicalTradition"
      | "DerivedCharacteristic"
      | "AnimistPower"
      | "Tribe"
    >
  }
>(({ getInstanceById }, locale, { content: entry }) => {
  const { translate, translateMap } = locale
  const translation = translateMap(entry.translations)

  if (translation === undefined) {
    return undefined
  }

  const env = {
    translate,
    translateMap,
    getInstanceById,
    localeJoin: locale.join,
    energyUnit: "ArcaneEnergy",
    responsiveTextSize: ResponsiveTextSize.Full,
  } satisfies Partial<EnvMap>

  const { cost, duration } = renderAnimistPowerPerformanceParameters(
    entry.parameters,
  ).run(env)

  const levels = entry.levels?.length ?? 1

  const prerequisites =
    entry.prerequisites === undefined
      ? undefined
      : printAnimistPowerPrerequisites(
          getInstanceById,
          locale,
          entry.prerequisites,
        )

  const additionalEffectsFromLevels =
    entry.levels
      ?.map(level => translateMap(level.translations)?.effect)
      .filter(isNotNullish)
      .map(text => text)
      .join("\n\n") ?? ""

  const mergedEffect = ((): ActivatableSkillEffect => {
    switch (translation.effect.kind) {
      case "Plain":
        return Case("Plain", {
          text: `${translation.effect.Plain.text}\n\n${additionalEffectsFromLevels}`,
        })
      case "ForEachQualityLevel":
        return Case("ForEachQualityLevel", {
          ...translation.effect.ForEachQualityLevel,
          text_after: [
            translation.effect.ForEachQualityLevel.text_after,
            additionalEffectsFromLevels,
          ]
            .filter(isNotNullish)
            .join("\n\n"),
        })
      case "ForEachTwoQualityLevels":
        return Case("ForEachTwoQualityLevels", {
          ...translation.effect.ForEachTwoQualityLevels,
          text_after: [
            translation.effect.ForEachTwoQualityLevels.text_after,
            additionalEffectsFromLevels,
          ]
            .filter(isNotNullish)
            .join("\n\n"),
        })
      default:
        return assertExhaustive(translation.effect)
    }
  })()

  return {
    title:
      (translation.name_in_library ?? translation.name) +
      parensIf(
        levels > 2
          ? Array.from({ length: levels }, (_, i) => romanize(i + 1)).join("/")
          : undefined,
      ),
    className: "animist-power",
    body: [
      {
        type: "definitionList",
        items: [
          renderSkillCheck(entry.check).run(env),
          renderEffect(mergedEffect).run(env),
          combineGeneratedTextWithStaticTranslation(
            translate("AE Cost"),
            cost,
            translation.cost,
          ),
          combineGeneratedTextWithStaticTranslation(
            translate("Duration"),
            duration,
            translation.duration,
          ),
          renderProperty(entry.property).run(env),
          {
            label: translate("Tribe Tradition"),
            value: renderAnimistPowerTribeTradition(
              translate,
              translateMap,
              locale.compare,
              getInstanceById,
              entry.tribe_tradition,
            ),
          },
          renderAnimistPowerImprovementCost(entry.improvement_cost).run(env),
          combineGeneratedTextWithStaticTranslation(
            translate("Prerequisites"),
            prerequisites,
            translation.prerequisites,
          ),
        ],
      },
    ],
    errata: translation.errata,
    references: entry.src,
  }
})

/**
 * Get a JSON representation of the rules text for a Goede ritual.
 */
export const getGeodeRitualEntityDescription = createEntityDescriptionCreator<
  "GeodeRitual",
  {
    getInstanceById: GetInstanceById<
      | "Publication"
      | "Attribute"
      | "SkillModificationLevel"
      | "TargetCategory"
      | "Property"
      | "MagicalTradition"
      | "DerivedCharacteristic"
    >
  }
>(({ getInstanceById }, locale, { content: entry }) => {
  const { translate, translateMap } = locale
  const translation = translateMap(entry.translations)

  if (translation === undefined) {
    return undefined
  }

  const env = {
    translate,
    translateMap,
    getInstanceById,
    localeJoin: locale.join,
    energyUnit: "ArcaneEnergy",
    responsiveTextSize: ResponsiveTextSize.Full,
  } satisfies Partial<EnvMap>

  const castingTime = renderSlowSkillNonModifiableCastingTime(
    entry.parameters.casting_time,
  ).run(env)

  const cost = renderMagicalActionCost(entry.parameters.cost).run(env)

  const range = renderNonModifiableRange(
    entry.parameters.range.kind === "Fixed"
      ? {
          kind: "Fixed",
          Fixed: { ...entry.parameters.range.Fixed, unit: { kind: "Steps" } },
        }
      : entry.parameters.range,
    false,
  ).run(env)

  const duration = renderOneTimeDuration(entry.parameters.duration).run(env)

  return {
    title: translation.name,
    className: "geode-ritual",
    body: [
      {
        type: "definitionList",
        items: [
          renderSkillCheck(entry.check).run(env),
          renderEffect(translation.effect).run(env),
          combineGeneratedTextWithStaticTranslation(
            translate("Ritual Time"),
            castingTime,
            translation.casting_time,
          ),
          combineGeneratedTextWithStaticTranslation(
            translate("AE Cost"),
            cost,
            translation.cost,
          ),
          combineGeneratedTextWithStaticTranslation(
            translate("Range"),
            range,
            translation.range,
          ),
          combineGeneratedTextWithStaticTranslation(
            translate("Duration"),
            duration,
            translation.duration,
          ),
          renderTargetCategory(entry.target).run(env),
          entry.prerequisites === undefined
            ? undefined
            : {
                label: translate("Prerequisites"),
                value: printGeodeRitualPrerequisites(
                  locale,
                  entry.prerequisites,
                ),
              },
          renderProperty(entry.property).run(env),
          {
            label: translate("Improvement Cost"),
            value: "B",
          },
        ],
      },
    ],
    errata: translation.errata,
    references: entry.src,
  }
})

/**
 * Get a JSON representation of the rules text for a jester trick.
 */
export const getJesterTrickEntityDescription = createEntityDescriptionCreator<
  "JesterTrick",
  {
    getInstanceById: GetInstanceById<
      | "Publication"
      | "Attribute"
      | "SkillModificationLevel"
      | "TargetCategory"
      | "Property"
      | "MagicalTradition"
      | "DerivedCharacteristic"
    >
    idMap: IdMap
  }
>(({ getInstanceById, idMap }, locale, { content: entry }) => {
  const { translate, translateMap } = locale
  const translation = translateMap(entry.translations)

  if (translation === undefined) {
    return undefined
  }

  const env = {
    translate,
    translateMap,
    getInstanceById,
    localeJoin: locale.join,
    energyUnit: "ArcaneEnergy",
    responsiveTextSize: ResponsiveTextSize.Full,
  } satisfies Partial<EnvMap>

  const { value: actions, ...castingTimeRest } = entry.parameters.casting_time
  const castingTime = renderFastSkillNonModifiableCastingTime({
    ...castingTimeRest,
    actions,
  }).run(env)

  const cost = renderNonModifiableOneTimeCost(entry.parameters.cost, false).run(
    env,
  )

  const range = renderNonModifiableRange(
    entry.parameters.range.kind === "Fixed"
      ? {
          kind: "Fixed",
          Fixed: { ...entry.parameters.range.Fixed, unit: { kind: "Steps" } },
        }
      : entry.parameters.range,
    false,
  ).run(env)

  const duration = renderOneTimeDuration(entry.parameters.duration).run(env)

  return {
    title: translation.name,
    className: "jester-trick",
    body: [
      {
        type: "definitionList",
        items: [
          renderSkillCheckWithPenalty(
            entry.check,
            entry.check_penalty,
            idMap,
          ).run(env),
          renderEffect(translation.effect).run(env),
          combineGeneratedTextWithStaticTranslation(
            translate("Casting Time"),
            castingTime,
            translation.casting_time,
          ),
          combineGeneratedTextWithStaticTranslation(
            translate("AE Cost"),
            cost,
            translation.cost,
          ),
          combineGeneratedTextWithStaticTranslation(
            translate("Range"),
            range,
            translation.range,
          ),
          combineGeneratedTextWithStaticTranslation(
            translate("Duration"),
            duration,
            translation.duration,
          ),
          renderTargetCategory(entry.target).run(env),
          renderProperty(entry.property).run(env),
          renderImprovementCost(entry.improvement_cost).run(env),
        ],
      },
    ],
    errata: translation.errata,
    references: entry.src,
  }
})

/**
 * Get a JSON representation of the rules text for a Zibilja ritual.
 */
export const getZibiljaRitualEntityDescription = createEntityDescriptionCreator<
  "ZibiljaRitual",
  {
    getInstanceById: GetInstanceById<
      | "Publication"
      | "Attribute"
      | "SkillModificationLevel"
      | "TargetCategory"
      | "Property"
      | "MagicalTradition"
      | "DerivedCharacteristic"
    >
    idMap: IdMap
  }
>(({ getInstanceById, idMap }, locale, { content: entry }) => {
  const { translate, translateMap } = locale
  const translation = translateMap(entry.translations)

  if (translation === undefined) {
    return undefined
  }

  const env = {
    translate,
    translateMap,
    getInstanceById,
    localeCompare: locale.compare,
    localeJoin: locale.join,
    energyUnit: "ArcaneEnergy",
    responsiveTextSize: ResponsiveTextSize.Full,
  } satisfies Partial<EnvMap>

  const { castingTime, cost, range, duration } =
    renderSlowOneTimePerformanceParameters(
      nestedCastingTime =>
        renderCastingTime(
          renderSlowSkillNonModifiableCastingTime,
          nestedCastingTime,
        ).with(nestedEnv => ({ ...nestedEnv, speed: Speed.Slow })),
      entry.parameters,
    ).run(env)

  return {
    title: translation.name,
    className: "zibilja-ritual",
    body: [
      {
        type: "definitionList",
        items: [
          renderSkillCheckWithPenalty(
            entry.check,
            entry.check_penalty,
            idMap,
          ).run(env),
          renderEffect(translation.effect).run(env),
          combineGeneratedTextWithStaticTranslation(
            translate("Ritual Time"),
            castingTime,
            translation.casting_time,
          ),
          combineGeneratedTextWithStaticTranslation(
            translate("AE Cost"),
            cost,
            translation.cost,
          ),
          combineGeneratedTextWithStaticTranslation(
            translate("Range"),
            range,
            translation.range,
          ),
          combineGeneratedTextWithStaticTranslation(
            translate("Duration"),
            duration,
            translation.duration,
          ),
          renderTargetCategory(entry.target).run(env),
          renderProperty(entry.property).run(env),
          renderImprovementCost(entry.improvement_cost).run(env),
        ],
      },
    ],
    errata: translation.errata,
    references: entry.src,
  }
})

const deriveValueGroupsFromMagicalRuneOptions = <T>(
  options: Lazy<MagicalRuneOption[]>,
  grouper: (option: MagicalRuneOption) => T,
  comparator: Compare<T>,
  printValue: (value: T) => string,
): StdReader<string, "t" | "tm" | "lc" | "lj"> =>
  Reader.sequence(
    Map.groupBy(options.value, grouper)
      .entries()
      .toArray()
      .toSorted(on(item => item[0], comparator))
      .map(([value, matchingOptions]) =>
        Reader.asks(
          ({
            translateMap,
            localeJoin,
            localeCompare,
          }: StdEnv<"tm" | "lj" | "lc">) =>
            `${printValue(value)} (${localeJoin(
              matchingOptions
                .map(
                  option =>
                    translateMap(option.translations)?.name ?? MISSING_VALUE,
                )
                .toSorted(localeCompare),
              "conjunction",
            )})`,
        ),
      ),
  ).then(formattedOptions => localeJoinR(formattedOptions, "disjunction"))

const renderMagicalRuneCost = (
  options: Lazy<MagicalRuneOption[]>,
  cost: MagicalRuneCost,
) => {
  switch (cost.kind) {
    case "Single":
      return formatEnergyR(cost.Single.value).thenW(text =>
        appendNoteIfNeeded(cost.Single.translations, text),
      )
    case "Disjunction":
      return Reader.sequence(
        cost.Disjunction.list.map(costItem =>
          formatEnergyR(costItem.value).thenW(text =>
            appendNoteIfNeeded(costItem.translations, text),
          ),
        ),
      ).thenW(text => localeJoinR(text, "disjunction"))
    case "DerivedFromOption":
      return deriveValueGroupsFromMagicalRuneOptions(
        options,
        option => option.cost?.value,
        compareNullish(numAsc),
        num => num?.toString() ?? MISSING_VALUE,
      ).thenW(formatEnergyR)
    default:
      return assertExhaustive(cost)
  }
}

const renderSplitMagicalRuneParameterTranslation = (
  parameter: OldParameterBySpeed,
): StdReader<string, "rts"> =>
  responsiveR(
    () => parameter.fast.full,
    () => parameter.fast.abbr,
  ).map2(
    responsiveR(
      () => parameter.slow.full,
      () => parameter.slow.abbr,
    ),
    (fast, slow) => `${slow} / ${fast}`,
  )

const renderMagicalRunCraftingTimePart = (
  craftingTime: MagicalRuneCraftingTime,
  unit: TimeSpanUnit,
) =>
  formatTimeSpanR(unit, craftingTime.value).thenW(text => {
    if (craftingTime.per === undefined) {
      return Reader.of(text)
    }

    const { translations } = craftingTime.per

    return translateMapR(translations).thenW(translation => {
      if (translation === undefined) {
        return Reader.of(text)
      }

      return responsiveTextR(translation.countable).thenW(countable =>
        responsiveTranslateR(
          "{$cost} per {$countable}",
          "{$cost}/{$countable}",
          { cost: text, countable },
        ),
      )
    })
  })

const renderMagicalRuneCraftingTime = (craftingTime: MagicalRuneCraftingTime) =>
  renderMagicalRunCraftingTimePart(craftingTime, "Actions").map2(
    renderMagicalRunCraftingTimePart(craftingTime, "Days"),
    (fast, slow) => `${slow} / ${fast}`,
  )

const renderMagicalRuneDuration = (duration: MagicalRuneDuration) =>
  renderCheckResultBasedDuration(duration.fast).map2(
    renderCheckResultBasedDuration(duration.slow),
    (fast, slow) => `${slow} / ${fast}`,
  )

const renderMagicalRuneImprovementCost = (
  options: Lazy<MagicalRuneOption[]>,
  improvementCost: MagicalRuneImprovementCost,
): StdReader<
  RawDefinitionListEntityDescriptionSectionItem,
  "t" | "tm" | "lc" | "lj" | "eu"
> => {
  switch (improvementCost.kind) {
    case "Constant":
      return renderImprovementCost(improvementCost.Constant)
    case "DerivedFromOption":
      return deriveValueGroupsFromMagicalRuneOptions(
        options,
        option =>
          option.improvement_cost === undefined
            ? undefined
            : renderImprovementCostValue(option.improvement_cost),
        compareNullish((a, b) => a.localeCompare(b)),
        selectedImprovementCost => selectedImprovementCost ?? MISSING_VALUE,
      )
        .thenW(formatEnergyR)
        .then(value =>
          translateR("Improvement Cost").map(label => ({ label, value })),
        )
    default:
      return assertExhaustive(improvementCost)
  }
}

/**
 * Get a JSON representation of the rules text for a magical rune.
 */
export const getMagicalRuneEntityDescription = createEntityDescriptionCreator<
  "MagicalRune",
  {
    getInstanceById: GetInstanceById<
      | "Publication"
      | "Attribute"
      | "Property"
      | "DerivedCharacteristic"
      | "Skill"
    >
    getAllChildInstancesForParent: GetAllChildInstancesForParent<"MagicalRuneOption">
    idMap: IdMap
  }
>(
  (
    { getInstanceById, getAllChildInstancesForParent, idMap },
    locale,
    { id, content: entry },
  ) => {
    const { translate, translateMap } = locale
    const translation = translateMap(entry.translations)

    if (translation === undefined) {
      return undefined
    }

    const env = {
      translate,
      translateMap,
      getInstanceById,
      localeCompare: locale.compare,
      localeJoin: locale.join,
      energyUnit: "ArcaneEnergy",
      responsiveTextSize: ResponsiveTextSize.Full,
    } satisfies Partial<EnvMap>

    const options = Lazy.of(() =>
      getAllChildInstancesForParent("MagicalRuneOption", id).map(
        item => item.content,
      ),
    )

    const cost = renderMagicalRuneCost(options, entry.parameters.cost).run(env)
    const craftingTime = renderMagicalRuneCraftingTime(
      entry.parameters.crafting_time,
    ).run(env)
    const duration = renderMagicalRuneDuration(entry.parameters.duration).run(
      env,
    )

    return {
      title:
        (translation.name_in_library ?? translation.name) +
        parensIf(translation.native_name),
      className: "magical-rune",
      body: [
        {
          type: "definitionList",
          items: [
            renderSkillCheckWithPenalty(
              entry.check,
              entry.check_penalty,
              idMap,
            ).run(env),
            renderEffect(translation.effect).run(env),
            combineGeneratedTextWithStaticTranslation(
              translate("AE Cost"),
              cost,
              translation.cost,
            ),
            combineGeneratedTextWithStaticTranslation(
              translate("Crafting Time (slow / fast)"),
              craftingTime,
              translation.crafting_time === undefined
                ? undefined
                : renderSplitMagicalRuneParameterTranslation(
                    translation.crafting_time,
                  ).run(env),
            ),
            combineGeneratedTextWithStaticTranslation(
              translate("Duration (slow / fast)"),
              duration,
              translation.duration === undefined
                ? undefined
                : renderSplitMagicalRuneParameterTranslation(
                    translation.duration,
                  ).run(env),
            ),
            renderProperty(entry.property).run(env),
            renderMagicalRuneImprovementCost(
              options,
              entry.improvement_cost,
            ).run(env),
          ],
        },
      ],
      errata: translation.errata,
      references: entry.src,
    }
  },
)
