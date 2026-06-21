import { identity } from "@elyukai/utils/function"
import { Reader } from "@elyukai/utils/reader"
import type {
  CheckResultBasedModifier,
  DurationUnitValue,
  ElvenMagicalSongPermanentCost,
  FirstPersonMagicalMelodyCost,
  MultipleOneTimeCosts,
  NonModifiableOneTimeCostPerCountable,
  NonModifiableSustainedCost,
  OneTimeCost,
  OneTimeCostMap,
  ResponsiveText,
  ResponsiveTextOptional,
  ResponsiveTextReplace,
  SingleOneTimeCost,
  SkillModificationLevel_ID,
  SustainedCost,
  SustainedCostMap,
} from "@optolith/database-schema/gen"
import { mapNullable } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import {
  responsiveTranslate,
  type LocaleMap,
  type Translate,
} from "../../../../helpers/translate.js"
import { renderResponsiveMap } from "../../map.js"
import {
  formatEnergyFnR,
  formatEnergyR,
  getInstanceByIdFnR,
  modifiableBySpeedR,
  responsiveLocaleJoinR,
  responsiveR,
  responsiveTextR,
  responsiveTranslateR,
  translateMapR,
  translateR,
  type StdEnv,
  type StdReader,
} from "../../reader.js"
import {
  appendNoteIfNeeded,
  replaceTextIfNeeded,
  type ResponsiveTextSize,
} from "../../responsiveText.js"
import { formatCombinedTimeSpan, formatCombinedTimeSpanR } from "../../units/timeSpan.js"
import { MISSING_VALUE } from "../../unknown.js"
import { appendCheckResultModifier } from "./checkResultBased.js"
import { wrapIfMinimum } from "./isMinimumMaximum.js"
import { appendNonModifiableSuffix, ModifiableParameter } from "./nonModifiableSuffix.js"

const deriveModifiableCost = (
  modificationLevelId: SkillModificationLevel_ID,
): StdReader<number | undefined, "s" | "ibi", "SkillModificationLevel"> =>
  getInstanceByIdFnR<"SkillModificationLevel">().thenW(
    getInstanceById =>
      mapNullable(
        getInstanceById("SkillModificationLevel", modificationLevelId),
        modificationLevel => modifiableBySpeedR("cost", modificationLevel),
      ) ?? Reader.of(undefined),
  )

const appendPerCountableToCostIfNeeded = (
  value:
    | {
        minimum_total?: number
        translations: LocaleMap<{
          countable: ResponsiveText
        }>
      }
    | undefined,
  baseCost: string,
): StdReader<string, "t" | "tm" | "rts" | "eu"> => {
  if (value === undefined) {
    return Reader.of(baseCost)
  }

  const { translations, minimum_total } = value

  return translateMapR(translations).thenW(translation => {
    if (translation === undefined) {
      return Reader.of(baseCost)
    }

    return responsiveTextR(translation.countable)
      .thenW(countable =>
        responsiveTranslateR("{$cost} per {$countable}", "{$cost}/{$countable}", {
          cost: baseCost,
          countable,
        }),
      )
      .thenW(text =>
        minimum_total === undefined
          ? Reader.of(text)
          : formatEnergyR(minimum_total).then(cost =>
              translateR("{$baseCost}, minimum of {$value}", {
                baseCost: text,
                value: cost,
              }),
            ),
      )
  })
}

const appendPermanentCostIfNeeded = (
  permanentValue: number | undefined,
  baseCost: string,
): StdReader<string, "t" | "rts"> =>
  mapNullable(permanentValue, value =>
    responsiveTranslateR(
      ".input {$value :number} {{, {$value} of which are permanent}}",
      " ({$value} perm.)",
      { value },
    ).map(text => baseCost + text),
  ) ?? Reader.of(baseCost)

const appendElvenPermanentCostIfNeeded = (
  permanent: ElvenMagicalSongPermanentCost | undefined,
  baseCost: string,
): StdReader<string, "t" | "tm" | "rts"> =>
  mapNullable(permanent, value =>
    responsiveTranslateR(".input {$value :number} {{{$value} permanent AE}}", "{$value} pAE", {
      value: value.value,
    })
      .thenW(text => replaceTextIfNeeded(value.translations, text))
      .map(text => baseCost + text),
  ) ?? Reader.of(baseCost)

const appendFamiliarsTrickLPCostIfNeeded = (
  lpValue: number | undefined,
  baseCost: string,
): StdReader<string, "t" | "lj" | "rts"> =>
  lpValue === undefined
    ? Reader.of(baseCost)
    : formatEnergyR(lpValue)
        .with((env: StdEnv<"t">) => ({ ...env, energyUnit: "LifePoints" }))
        .thenW(formattedLpCost => responsiveLocaleJoinR([baseCost, formattedLpCost], "conjunction"))

/**
 * Returns the text for the modifiable one-time cost of an activatable skill.
 */
export const renderModifiableOneTimeCost = (value: {
  initial_modification_level: SkillModificationLevel_ID
  permanent_value?: number
  translations?: LocaleMap<{
    replacement?: ResponsiveTextReplace
    additional?: ResponsiveText
  }>
}): StdReader<string, "t" | "tm" | "rts" | "eu" | "s" | "ibi", "SkillModificationLevel"> =>
  deriveModifiableCost(value.initial_modification_level).thenW(cost =>
    cost === undefined
      ? Reader.of(MISSING_VALUE)
      : formatEnergyR(cost)
          .thenW(text => replaceTextIfNeeded(value.translations, text))
          .then(text =>
            translateMapR(value.translations).thenW(translation => {
              if (translation?.additional === undefined) {
                return Reader.of(text)
              }

              return responsiveTextR(translation.additional).map(
                additional => `${text} + ${additional}`,
              )
            }),
          ),
  )

const appendIntervalToCostR = (interval: DurationUnitValue | undefined, baseCost: string) =>
  interval === undefined
    ? Reader.of(baseCost)
    : formatCombinedTimeSpanR(interval, true).then(formattedInterval =>
        responsiveTranslateR("{$cost} per {$interval}", "{$cost}/{$interval}", {
          cost: baseCost,
          interval: formattedInterval,
        }),
      )

const appendIntervalToCost = (
  translate: Translate,
  responsiveTextSize: ResponsiveTextSize,
  interval: DurationUnitValue | undefined,
  baseCost: string,
) =>
  interval === undefined
    ? baseCost
    : responsiveTranslate(
        translate,
        responsiveTextSize,
        "{$cost} per {$interval}",
        "{$cost}/{$interval}",
        {
          cost: baseCost,
          interval: formatCombinedTimeSpan(translate, responsiveTextSize, interval, true),
        },
      )

type NonModifiableOneTimeCost = {
  is_minimum?: boolean
  value: number
  lp_value?: number
  permanent_value?: number
  interval?: DurationUnitValue
  permanent?: ElvenMagicalSongPermanentCost
  per?: NonModifiableOneTimeCostPerCountable
  translations?: LocaleMap<{
    note?: ResponsiveTextOptional
  }>
}

/**
 * Returns the text for a non-modifiable one-time cost of an activatable skill.
 */
export const renderNonModifiableOneTimeCost = (
  value: NonModifiableOneTimeCost,
  shouldAppendNonModifiableSuffix: boolean,
): StdReader<string, "t" | "tm" | "rts" | "eu" | "nms" | "lj"> =>
  formatEnergyR(value.value)
    .thenW(base => appendFamiliarsTrickLPCostIfNeeded(value.lp_value, base))
    .thenW(base => appendPerCountableToCostIfNeeded(value.per, base))
    .then(base => appendPermanentCostIfNeeded(value.permanent_value, base))
    .then(base => appendIntervalToCostR(value.interval, base))
    .then(base => appendElvenPermanentCostIfNeeded(value.permanent, base))
    .then(base => wrapIfMinimum(value.is_minimum, base))
    .then(base => appendNoteIfNeeded(value.translations, base))
    .then(
      shouldAppendNonModifiableSuffix
        ? base => appendNonModifiableSuffix(ModifiableParameter.Cost, base)
        : base => Reader.of(base),
    )

type IndefiniteCost = {
  modifier?: CheckResultBasedModifier
  translations: LocaleMap<{
    description: ResponsiveText
  }>
}

/**
 * Returns the text for the indefinite cost of an activatable skill.
 */
export const renderIndefiniteCost = (
  value: IndefiniteCost,
  shouldAppendNonModifiableSuffix: boolean,
): StdReader<string, "t" | "tm" | "rts" | "eu" | "nms"> => {
  const { modifier, translations } = value
  return translateMapR(translations)
    .thenW(translation =>
      translation === undefined
        ? Reader.of(MISSING_VALUE)
        : responsiveTextR(translation.description),
    )
    .map(modifier === undefined ? identity : base => appendCheckResultModifier(base, modifier))
    .thenW(
      shouldAppendNonModifiableSuffix
        ? base => appendNonModifiableSuffix(ModifiableParameter.Cost, base)
        : base => Reader.of(base),
    )
}

const renderSingleOneTimeCost = (
  value: SingleOneTimeCost,
): StdReader<
  string,
  "t" | "tm" | "rts" | "eu" | "s" | "nms" | "ibi" | "lj",
  "SkillModificationLevel"
> => {
  switch (value.kind) {
    case "Modifiable":
      return renderModifiableOneTimeCost(value.Modifiable)
    case "NonModifiable":
      return renderNonModifiableOneTimeCost(value.NonModifiable, true)
    case "Indefinite":
      return renderIndefiniteCost(value.Indefinite, true)
    default:
      return assertExhaustive(value)
  }
}

const renderMultipleOneTimeCosts = (
  type: "conjunction" | "disjunction",
  value: MultipleOneTimeCosts,
): StdReader<
  string,
  "t" | "tm" | "lj" | "rts" | "eu" | "s" | "nms" | "ibi",
  "SkillModificationLevel"
> => {
  const appendNonModifiableIfRequested = !value.every(part => part.kind === "Modifiable")
    ? (text: string) => appendNonModifiableSuffix(ModifiableParameter.Cost, text)
    : (text: string) => Reader.of(text)

  return Reader.sequence(value.map(renderSingleOneTimeCost))
    .thenW(list => responsiveLocaleJoinR(list, type))
    .then(text => appendNonModifiableIfRequested(text))
}

/**
 * Returns the text for a one-time cost map of an activatable skill.
 */
export const renderOneTimeCostMap = (
  value: OneTimeCostMap,
): StdReader<string, "t" | "tm" | "rts" | "nms" | "eu"> =>
  Reader.asks(({ translate }: StdEnv<"t">) => translate).thenW(translate =>
    formatEnergyFnR
      .thenW(formatEnergy =>
        renderResponsiveMap(
          value,
          option => option.value,
          formatEnergy,
          value.options.every(option => option.permanent_value !== undefined)
            ? {
                surround: values =>
                  translate(", {$value} of which are permanent", {
                    value: values,
                  }),
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- is checked beforehand
                getAdditionalValue: option => option.permanent_value!,
              }
            : undefined,
        ),
      )
      .then(text => appendNonModifiableSuffix(ModifiableParameter.Cost, text)),
  )

const renderSustainedCostMap = (value: SustainedCostMap) =>
  formatEnergyFnR
    .thenW(formatEnergy =>
      Reader.ask<StdEnv<"t" | "rts">>().thenW(({ translate, responsiveTextSize }) =>
        renderResponsiveMap(
          value,
          option => option.value,
          singleValue =>
            appendIntervalToCost(
              translate,
              responsiveTextSize,
              value.interval,
              formatEnergy(singleValue),
            ),
        ),
      ),
    )
    .then(text => appendNonModifiableSuffix(ModifiableParameter.Cost, text))

/**
 * Returns the text for the cost of a one-time activatable skill.
 */
export const renderOneTimeCost = (
  value: OneTimeCost,
): StdReader<
  string,
  "t" | "tm" | "lj" | "rts" | "eu" | "s" | "nms" | "ibi",
  "SkillModificationLevel"
> => {
  switch (value.kind) {
    case "Single":
      return renderSingleOneTimeCost(value.Single)
    case "Conjunction":
      return renderMultipleOneTimeCosts("conjunction", value.Conjunction)
    case "Disjunction":
      return renderMultipleOneTimeCosts("disjunction", value.Disjunction)
    case "Map":
      return renderOneTimeCostMap(value.Map)
    default:
      return assertExhaustive(value)
  }
}

const buildSustainedCost = (
  activationCost: string,
  intervalCost: string,
  interval: DurationUnitValue,
) => {
  const activationCostWithLabel = responsiveR(
    () => translateR("activation").map(label => `${activationCost} (${label})`),
    () => Reader.of(activationCost),
  ).thenW(identity)

  const intervalCostWithLabel = appendIntervalToCostR(interval, intervalCost)

  return activationCostWithLabel.map2(
    intervalCostWithLabel,
    (activationStr, intervalStr) => `${activationStr} + ${intervalStr}`,
  )
}

const renderModifiableSustainedCost = (value: {
  initial_modification_level: SkillModificationLevel_ID
  interval: DurationUnitValue
}) =>
  deriveModifiableCost(value.initial_modification_level).thenW(cost =>
    cost === undefined
      ? Reader.of(MISSING_VALUE)
      : formatEnergyFnR.thenW(formatEnergy => {
          const activationCost = formatEnergy(cost)
          const intervalCost = formatEnergy(cost / 2)

          return buildSustainedCost(activationCost, intervalCost, value.interval)
        }),
  )

/**
 * Returns the text for the non-modifiable cost of a sustained activatable skill.
 */
export const renderNonModifiableSustainedCost = (value: NonModifiableSustainedCost) =>
  formatEnergyFnR
    .thenW(formatEnergy => {
      const activationCost = formatEnergy(value.value)
      const getIntervalCost =
        value.is_minimum === true
          ? responsiveTranslateR("half of the activation cost", "50%")
          : Reader.of(formatEnergy(value.value / 2))

      return getIntervalCost.then(intervalCost =>
        buildSustainedCost(activationCost, intervalCost, value.interval),
      )
    })
    .thenW(base => appendPerCountableToCostIfNeeded(value.per, base))
    .then(base => wrapIfMinimum(value.is_minimum, base))
    .then(base => appendNonModifiableSuffix(ModifiableParameter.Cost, base))

/**
 * Returns the text for the cost of a sustained activatable skill.
 */
export const renderSustainedCost = (
  value: SustainedCost,
): StdReader<string, "t" | "tm" | "rts" | "eu" | "s" | "nms" | "ibi", "SkillModificationLevel"> => {
  switch (value.kind) {
    case "Modifiable":
      return renderModifiableSustainedCost(value.Modifiable)
    case "NonModifiable":
      return renderNonModifiableSustainedCost(value.NonModifiable)
    case "Map":
      return renderSustainedCostMap(value.Map)
    default:
      return assertExhaustive(value)
  }
}

type MagicalActionCost =
  | {
      kind: "Fixed"
      Fixed: NonModifiableOneTimeCost
    }
  | {
      kind: "Indefinite"
      Indefinite: IndefiniteCost
    }
  | {
      kind: "FirstPerson"
      FirstPerson: FirstPersonMagicalMelodyCost
    }
  | {
      kind: "ByPrimaryPatron"
      ByPrimaryPatron?: {
        interval?: DurationUnitValue
        translations?: LocaleMap<{ note: ResponsiveTextOptional }>
      }
    }
  | {
      kind: "All"
      All: {
        minimum?: number
      }
    }
  | {
      kind: "Map"
      Map: OneTimeCostMap
    }

/**
 * Generates the text for the cost specific to a magical action.
 */
export const renderMagicalActionCost = (
  cost: MagicalActionCost,
): StdReader<string, "t" | "tm" | "rts" | "eu" | "nms" | "lj"> => {
  switch (cost.kind) {
    case "Fixed":
      return renderNonModifiableOneTimeCost(cost.Fixed, false)
    case "Indefinite":
      return renderIndefiniteCost(cost.Indefinite, false)
    case "FirstPerson":
      return Reader.asks(({ translate }) =>
        translate(
          "{$firstPersonValue} for the first person; {$additionalPersonValue} for each additional person",
          {
            firstPersonValue: translate("{$value} AE", {
              value: cost.FirstPerson.value,
            }),
            additionalPersonValue: translate("{$value} AE", {
              value: cost.FirstPerson.value / 2,
            }),
          },
        ),
      )
    case "ByPrimaryPatron":
      return translateR("Depends on animal type").thenW(base =>
        appendNoteIfNeeded(cost.ByPrimaryPatron?.translations, base),
      )
    case "All":
      return Reader.asks(({ translate }) =>
        cost.All.minimum === undefined
          ? translate("All AE")
          : translate("All AE, at least {$value} AE", {
              value: cost.All.minimum,
            }),
      )
    case "Map":
      return renderOneTimeCostMap(cost.Map)
    default:
      return assertExhaustive(cost)
  }
}
