import { ensureNonEmpty } from "@elyukai/utils/array/nonEmpty"
import { Compare } from "@optolith/helpers/compare"
import { isNotNullish, mapNullable } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type {
  ArcaneBardTraditionReference,
  ArcaneDancerTraditionReference,
  CurseCost,
  CurseDuration,
  DominationRitualCost,
  DominationRitualDuration,
  ElvenMagicalSongCost,
  FamiliarsTrickOneTimeCost,
  FamiliarsTrickOneTimeIntervalCost,
  FamiliarsTrickPerformanceParameters,
  FamiliarsTrickProperty,
  FamiliarsTrickSustainedCost,
  MagicalDanceCost,
  MagicalMelodyCost,
  MagicalTradition_ID,
  MusicDuration,
  Property_ID,
  ResponsiveTextOptional,
  SpellworkTraditions,
} from "optolith-database-schema/gen"
import { createEntityDescriptionCreator } from "../creator.js"
import type { GetInstanceById } from "../helpers/getTypes.js"
import type { LocaleCompare, LocaleJoin } from "../helpers/locale.js"
import { Translate, TranslateMap } from "../helpers/translate.js"
import { EntityDescriptionSection, type IdMap } from "../index.js"
import { renderAnimalTypesSection } from "./partial/animalTypes.js"
import { additionFormatter } from "./partial/mathOperation.js"
import {
  appendCheckResultModifier,
  getCheckResultBasedValueTranslation,
} from "./partial/rated/activatable/checkResultBased.js"
import {
  addCostInterval,
  addPerCountableToCost,
} from "./partial/rated/activatable/cost.js"
import {
  getDurationForOneTimeTranslation,
  getDurationForSustainedTranslation,
  getDurationTranslationForCantrip,
} from "./partial/rated/activatable/duration.js"
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
import {
  getModifiableBySpeed,
  Speed,
} from "./partial/rated/activatable/speed.js"
import { getTargetCategoryTranslation } from "./partial/rated/activatable/targetCategory.js"
import { createImprovementCost } from "./partial/rated/improvementCost.js"
import { getTextForCheck } from "./partial/rated/skillCheck.js"
import {
  getResponsiveText,
  getResponsiveTextOptional,
  replaceTextIfRequested,
  ResponsiveTextSize,
} from "./partial/responsiveText.js"
import { formatTimeSpan } from "./partial/units/timeSpan.js"
import { MISSING_VALUE } from "./partial/unknown.js"

const combineGeneratedTextWithStaticTranslation = (
  label: string,
  generatedText: string,
  staticText: ResponsiveTextOptional | string | undefined,
): EntityDescriptionSection => {
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
  "Cantrip",
  {
    getInstanceById: GetInstanceById<
      "TargetCategory" | "Property" | "MagicalTradition" | "Curriculum"
    >
  }
>(({ getInstanceById }, locale, { content: entry }) => {
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
    translate,
    translateMap,
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
    errata: translation.errata,
    references: entry.src,
  }
})

const renderCurseCost = (
  translate: Translate,
  translateMap: TranslateMap,
  responsiveTextSize: ResponsiveTextSize,
  cost: CurseCost,
) => {
  switch (cost.kind) {
    case "Fixed": {
      const translation = translateMap(cost.Fixed.translations)
      return (
        addPerCountableToCost(
          responsiveTextSize,
          translation,
          translate("{$value} AE", { value: cost.Fixed.value }),
        ) +
        parensIf(
          mapNullable(translation?.note, note =>
            getResponsiveTextOptional(note, responsiveTextSize),
          ),
        )
      )
    }
    case "Indefinite":
      return getResponsiveText(
        translateMap(cost.Indefinite.translations)?.description,
        responsiveTextSize,
      )
    default:
      return assertExhaustive(cost)
  }
}

const renderMagicalActionDuration = (
  translate: Translate,
  translateMap: TranslateMap,
  responsiveTextSize: ResponsiveTextSize,
  duration: CurseDuration | DominationRitualDuration,
) => {
  switch (duration.kind) {
    case "Immediate":
      return translate("Immediate")
    case "Fixed":
      return formatTimeSpan(
        translate,
        responsiveTextSize,
        duration.Fixed.unit,
        duration.Fixed.value,
      )
    case "CheckResultBased":
      return getCheckResultBasedValueTranslation(
        translate,
        duration.CheckResultBased,
      )
    case "Indefinite": {
      const translation = translateMap(duration.Indefinite.translations)
      const { maximum } = duration.Indefinite
      const wrapInMaximum: (text: string) => string =
        maximum === undefined
          ? text => text
          : text =>
              translate(
                "{$defaultDuration}, but no more than {$maximumDuration}",
                {
                  defaultDuration: text,
                  maximumDuration: renderMagicalActionDuration(
                    translate,
                    translateMap,
                    responsiveTextSize,
                    maximum,
                  ),
                },
              )
      const base = getResponsiveText(
        translation?.description,
        responsiveTextSize,
      )
      return wrapInMaximum(base)
    }
    default:
      return assertExhaustive(duration)
  }
}

/**
 * Get a JSON representation of the rules text for a curse.
 */
export const getCurseEntityDescription = createEntityDescriptionCreator<
  "Curse",
  {
    getInstanceById: GetInstanceById<
      "Attribute" | "Property" | "DerivedCharacteristic"
    >
    idMap: IdMap
  }
>(({ getInstanceById, idMap }, locale, { content: entry }) => {
  const { translate, translateMap } = locale
  const translation = translateMap(entry.translations)

  if (translation === undefined) {
    return undefined
  }

  const cost = renderCurseCost(
    translate,
    translateMap,
    ResponsiveTextSize.Full,
    entry.parameters.cost,
  )

  const duration = renderMagicalActionDuration(
    translate,
    translateMap,
    ResponsiveTextSize.Full,
    entry.parameters.duration,
  )

  return {
    title: translation.name,
    className: "curse",
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
      getTextForProperty(
        { translate, translateMap, getInstanceById },
        entry.property,
      ),
      {
        label: translate("Improvement Cost"),
        value: "B",
      },
    ],
    errata: translation.errata,
    references: entry.src,
  }
})

const renderElvenMagicalSongCost = (
  translate: Translate,
  translateMap: TranslateMap,
  responsiveTextSize: ResponsiveTextSize,
  cost: ElvenMagicalSongCost,
) => {
  const translation = translateMap(cost.translations)
  const base = translate("{$value} AE", { value: cost.value })

  const permanent =
    cost.permanent === undefined
      ? ""
      : (() => {
          const permanentBase = translate(
            ".input {$value :number} {{{$value} permanent AE}}",
            { value: cost.permanent.value },
          )

          const permanentFull = replaceTextIfRequested(
            "replacement",
            cost.permanent.translations,
            translateMap,
            responsiveTextSize,
            permanentBase,
          )

          return `, ${permanentFull}`
        })()

  return (
    addCostInterval(
      translate,
      responsiveTextSize,
      cost.interval,
      addPerCountableToCost(responsiveTextSize, translation, base),
    ) + permanent
  )
}

const renderMagicalActionSkill = (
  translate: Translate,
  translateMap: TranslateMap,
  localeCompare: LocaleCompare,
  localeJoin: LocaleJoin,
  getInstanceById: GetInstanceById<"Skill">,
  skill: string[],
): EntityDescriptionSection => ({
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
})

/**
 * Get a JSON representation of the rules text for an Elven magical song.
 */
export const getElvenMagicalSongEntityDescription =
  createEntityDescriptionCreator<
    "ElvenMagicalSong",
    {
      getInstanceById: GetInstanceById<
        "Attribute" | "Property" | "DerivedCharacteristic"
      >
      idMap: IdMap
    }
  >(({ getInstanceById, idMap }, locale, { content: entry }) => {
    const { translate, translateMap } = locale
    const translation = translateMap(entry.translations)

    if (translation === undefined) {
      return undefined
    }

    const cost = renderElvenMagicalSongCost(
      translate,
      translateMap,
      ResponsiveTextSize.Full,
      entry.parameters.cost,
    )

    return {
      title: translation.name,
      className: "elven-magical-song",
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
        renderMagicalActionSkill(
          translate,
          translateMap,
          locale.compare,
          locale.join,
          getInstanceById,
          entry.skill,
        ),
        combineGeneratedTextWithStaticTranslation(
          translate("AE Cost"),
          cost,
          translation.cost,
        ),
        getTextForProperty(
          { translate, translateMap, getInstanceById },
          entry.property,
        ),
        createImprovementCost(translate, entry.improvement_cost),
      ],
      errata: translation.errata,
      references: entry.src,
    }
  })

const renderDominationRitualCost = (
  translate: Translate,
  translateMap: TranslateMap,
  getInstanceById: GetInstanceById<"SkillModificationLevel">,
  responsiveTextSize: ResponsiveTextSize,
  cost: DominationRitualCost,
) => {
  const modificationLevel = getInstanceById(
    "SkillModificationLevel",
    cost.initial_modification_level,
  )

  if (modificationLevel === undefined) {
    return MISSING_VALUE
  }

  const base = translate("{$value} AE", {
    value: getModifiableBySpeed(Speed.Slow, "cost", modificationLevel),
  })

  const translation = translateMap(cost.translations)

  return translation?.additional === undefined
    ? base
    : additionFormatter(
        base,
        getResponsiveText(translation.additional, responsiveTextSize),
      )
}

/**
 * Get a JSON representation of the rules text for a domination ritual.
 */
export const getDominationRitualEntityDescription =
  createEntityDescriptionCreator<
    "DominationRitual",
    {
      getInstanceById: GetInstanceById<
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

    const cost = renderDominationRitualCost(
      translate,
      translateMap,
      getInstanceById,
      ResponsiveTextSize.Full,
      entry.parameters.cost,
    )

    const duration = renderMagicalActionDuration(
      translate,
      translateMap,
      ResponsiveTextSize.Full,
      entry.parameters.duration,
    )

    return {
      title: translation.name,
      className: "domination-ritual",
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
        getTextForProperty(
          { translate, translateMap, getInstanceById },
          entry.property,
        ),
        {
          label: translate("Improvement Cost"),
          value: "B",
        },
      ],
      errata: translation.errata,
      references: entry.src,
    }
  })

const renderMagicalDanceCost = (
  translate: Translate,
  translateMap: TranslateMap,
  responsiveTextSize: ResponsiveTextSize,
  cost: MagicalDanceCost,
): string => {
  switch (cost.kind) {
    case "Fixed": {
      const base = translate("{$value} AE", { value: cost.Fixed.value })
      const translation = translateMap(cost.Fixed.translations)
      return addPerCountableToCost(responsiveTextSize, translation, base)
    }
    case "Indefinite": {
      const translation = translateMap(cost.Indefinite.translations)
      const { maximum } = cost.Indefinite
      const wrapInMaximum: (text: string) => string =
        maximum === undefined
          ? text => text
          : text => appendCheckResultModifier(text, maximum)
      const base = getResponsiveText(
        translation?.description,
        responsiveTextSize,
      )
      return wrapInMaximum(base)
    }
    default:
      return assertExhaustive(cost)
  }
}

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
): EntityDescriptionSection => ({
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

const renderMusicDuration = (
  translate: Translate,
  duration: MusicDuration,
): string => {
  const length = (() => {
    switch (duration.length.kind) {
      case "Long":
        return translate("long")
      case "Short":
        return translate("short")
      default:
        return assertExhaustive(duration.length)
    }
  })()

  const reusability = (() => {
    switch (duration.reusability.kind) {
      case "OneTime":
        return translate("one-time")
      case "Sustainable":
        return translate("sustainable")
      default:
        return assertExhaustive(duration.reusability)
    }
  })()

  return `${length}, ${reusability}`
}

/**
 * Get a JSON representation of the rules text for a magical dance.
 */
export const getMagicalDanceEntityDescription = createEntityDescriptionCreator<
  "MagicalDance",
  {
    getInstanceById: GetInstanceById<
      "Attribute" | "Property" | "DerivedCharacteristic"
    >
  }
>(({ getInstanceById }, locale, { content: entry }) => {
  const { translate, translateMap } = locale
  const translation = translateMap(entry.translations)

  if (translation === undefined) {
    return undefined
  }

  const duration = renderMusicDuration(translate, entry.parameters.duration)

  const cost = renderMagicalDanceCost(
    translate,
    translateMap,
    ResponsiveTextSize.Full,
    entry.parameters.cost,
  )

  return {
    title: translation.name,
    className: "magical-dance",
    body: [
      getTextForCheck(
        { translate, translateMap, getInstanceById },
        entry.check,
      ),
      ...getTextForEffect(locale, translation.effect),
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
      getTextForProperty(
        { translate, translateMap, getInstanceById },
        entry.property,
      ),
      renderMusicTradition(
        translate,
        translateMap,
        locale.compare,
        getInstanceById,
        "ArcaneDancerTradition",
        entry.music_tradition,
      ),
      createImprovementCost(translate, entry.improvement_cost),
    ],
    errata: translation.errata,
    references: entry.src,
  }
})

const renderMagicalMelodyCost = (
  translate: Translate,
  cost: MagicalMelodyCost,
): string => {
  switch (cost.kind) {
    case "Fixed":
      return translate("{$value} AE", { value: cost.Fixed.value })
    case "FirstPerson":
      return translate(
        "{$firstPersonValue} for the first person; {$additionalPersonValue} for each additional person",
        {
          firstPersonValue: translate("{$value} AE", {
            value: cost.FirstPerson.value,
          }),
          additionalPersonValue: translate("{$value} AE", {
            value: cost.FirstPerson.value / 2,
          }),
        },
      )
    default:
      return assertExhaustive(cost)
  }
}

/**
 * Get a JSON representation of the rules text for a magical melody.
 */
export const getMagicalMelodyEntityDescription = createEntityDescriptionCreator<
  "MagicalMelody",
  {
    getInstanceById: GetInstanceById<
      "Attribute" | "Property" | "DerivedCharacteristic"
    >
  }
>(({ getInstanceById }, locale, { content: entry }) => {
  const { translate, translateMap } = locale
  const translation = translateMap(entry.translations)

  if (translation === undefined) {
    return undefined
  }

  const duration = renderMusicDuration(translate, entry.parameters.duration)
  const cost = renderMagicalMelodyCost(translate, entry.parameters.cost)

  return {
    title: translation.name,
    className: "magical-dance",
    body: [
      getTextForCheck(
        { translate, translateMap, getInstanceById },
        entry.check,
      ),
      ...getTextForEffect(locale, translation.effect),
      combineGeneratedTextWithStaticTranslation(
        translate("Duration"),
        duration,
        translation.duration,
      ),
      renderMagicalActionSkill(
        translate,
        translateMap,
        locale.compare,
        locale.join,
        getInstanceById,
        entry.skill,
      ),
      combineGeneratedTextWithStaticTranslation(
        translate("AE Cost"),
        cost,
        translation.cost,
      ),
      getTextForProperty(
        { translate, translateMap, getInstanceById },
        entry.property,
      ),
      renderMusicTradition(
        translate,
        translateMap,
        locale.compare,
        getInstanceById,
        "ArcaneBardTradition",
        entry.music_tradition,
      ),
      createImprovementCost(translate, entry.improvement_cost),
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

const renderFamiliarsTrickOneTimeCost = (
  translate: Translate,
  translateMap: TranslateMap,
  responsiveTextSize: ResponsiveTextSize,
  cost: FamiliarsTrickOneTimeCost,
): string => {
  switch (cost.kind) {
    case "Fixed":
      return addCostInterval(
        translate,
        responsiveTextSize,
        cost.Fixed.interval,
        addPerCountableToCost(
          responsiveTextSize,
          translateMap(cost.Fixed.translations),
          translate("{$value} AE", { value: cost.Fixed.value }),
        ),
      )
    case "All":
      return cost.All.minimum === undefined
        ? translate("All AE")
        : translate("All AE, at least {$value} AE", { value: cost.All.minimum })
    case "Indefinite":
      return getResponsiveText(
        translateMap(cost.Indefinite.translations)?.description,
        responsiveTextSize,
      )
    default:
      return assertExhaustive(cost)
  }
}

const renderFamiliarsTrickSustainedCost = (
  translate: Translate,
  responsiveTextSize: ResponsiveTextSize,
  cost: FamiliarsTrickOneTimeIntervalCost | FamiliarsTrickSustainedCost,
): string =>
  addCostInterval(
    translate,
    responsiveTextSize,
    cost.interval,
    translate("{$value} AE", { value: cost.value }),
  )

const renderFamiliarsTrickPerformanceParameters = (
  translate: Translate,
  translateMap: TranslateMap,
  responsiveTextSize: ResponsiveTextSize,
  params: FamiliarsTrickPerformanceParameters,
): { cost: string; duration: string } => {
  switch (params.kind) {
    case "OneTime":
      return {
        cost: renderFamiliarsTrickOneTimeCost(
          translate,
          translateMap,
          responsiveTextSize,
          params.OneTime.cost,
        ),
        duration: getDurationForOneTimeTranslation(
          translate,
          translateMap,
          responsiveTextSize,
          params.OneTime.duration,
        ),
      }
    case "OneTimeInterval":
      return {
        cost: renderFamiliarsTrickSustainedCost(
          translate,
          responsiveTextSize,
          params.OneTimeInterval.cost,
        ),
        duration: translate("depends on spent AE"),
      }
    case "Sustained":
      return {
        cost: renderFamiliarsTrickSustainedCost(
          translate,
          responsiveTextSize,
          params.Sustained.cost,
        ),
        duration: getDurationForSustainedTranslation(
          translate,
          responsiveTextSize,
          undefined,
        ),
      }
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
        "Attribute" | "Property" | "DerivedCharacteristic"
      >
    }
  >(({ getInstanceById }, locale, { content: entry }) => {
    const { translate, translateMap } = locale
    const translation = translateMap(entry.translations)

    if (translation === undefined) {
      return undefined
    }

    const { cost, duration } = renderFamiliarsTrickPerformanceParameters(
      translate,
      translateMap,
      ResponsiveTextSize.Full,
      entry.parameters,
    )

    return {
      title: translation.name,
      className: "magical-dance",
      body: [
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
      errata: translation.errata,
      references: entry.src,
    }
  })
