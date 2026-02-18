import { bind } from "@elyukai/utils/function"
import { mapNullable, mapNullableDefault } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import {
  IndefiniteOneTimeCost,
  ModifiableOneTimeCost,
  ModifiableSustainedCost,
  MultipleOneTimeCosts,
  NonModifiableOneTimeCost,
  NonModifiableOneTimeCostPerCountable,
  NonModifiableSustainedCost,
  OneTimeCost,
  SingleOneTimeCost,
  SustainedCost,
  type DurationUnitValue,
  type OneTimeCostMap,
  type ResponsiveTextOptional,
  type SustainedCostMap,
} from "optolith-database-schema/gen"
import type { GetInstanceById } from "../../../../helpers/getTypes.js"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import {
  responsiveTranslate,
  type Translate,
  type TranslateMap,
} from "../../../../helpers/translate.js"
import { renderResponsiveMap } from "../../map.js"
import {
  appendNoteIfRequested,
  getResponsiveText,
  getResponsiveTextOptional,
  replaceTextIfRequested,
  responsive,
  ResponsiveTextSize,
} from "../../responsiveText.js"
import { formatEnergyByEntity } from "../../units/energy.js"
import { formatTimeSpan } from "../../units/timeSpan.js"
import { MISSING_VALUE } from "../../unknown.js"
import { Entity } from "./entity.js"
import { wrapIfMinimum } from "./isMinimumMaximum.js"
import {
  getNonModifiableSuffixTranslation,
  ModifiableParameter,
} from "./nonModifiableSuffix.js"
import { getModifiableBySpeed, Speed } from "./speed.js"

const getModifiableOneTimeCostTranslation = (
  getInstanceById: GetInstanceById<"SkillModificationLevel">,
  locale: LocaleEnvironment,
  responsiveTextSize: ResponsiveTextSize,
  entity: Entity,
  speed: Speed,
  value: ModifiableOneTimeCost,
): string =>
  mapNullable(
    getInstanceById("SkillModificationLevel", value.initial_modification_level),
    modificationLevel => {
      const cost = getModifiableBySpeed(speed, "cost", modificationLevel)

      return replaceTextIfRequested(
        "replacement",
        value.translations,
        locale.translateMap,
        responsiveTextSize,
        formatEnergyByEntity(locale.translate, entity, cost),
      )
    },
  ) ?? MISSING_VALUE

const getNonModifiableOneTimeCostPerCountableTranslation = (
  formatCost: (x: number | string) => string,
  locale: LocaleEnvironment,
  responsiveTextSize: ResponsiveTextSize,
  value: NonModifiableOneTimeCostPerCountable | undefined,
) =>
  mapNullable(value, perCountable => {
    const entity = getResponsiveText(
      locale.translateMap(perCountable.translations)?.countable,
      responsiveTextSize,
    )

    const countableText = responsive(
      responsiveTextSize,
      () => locale.translate(" per {$value}", { value: entity }),
      () => locale.translate("/{$value}", { value: entity }),
    )

    const minimumTotalText =
      mapNullable(perCountable.minimum_total, minimumTotal =>
        locale.translate(", minimum of {$value}", {
          value: formatCost(minimumTotal),
        }),
      ) ?? ""

    return countableText + minimumTotalText
  }) ?? ""

const getPermanentValueTranslation = (
  locale: LocaleEnvironment,
  responsiveTextSize: ResponsiveTextSize,
  permanentValue: number | undefined,
) =>
  permanentValue === undefined
    ? ""
    : responsive(
        responsiveTextSize,
        () =>
          locale.translate(
            ".input {$value :number} {{, {$value} of which are permanent}}",
            {
              value: permanentValue,
            },
          ),
        () => locale.translate(" ({$value} perm.)", { value: permanentValue }),
      )

const getNonModifiableOneTimeCostTranslation = (
  locale: LocaleEnvironment,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: NonModifiableOneTimeCost,
): string => {
  const formatCostP = formatEnergyByEntity.bind(this, locale.translate, entity)

  const perCountable = getNonModifiableOneTimeCostPerCountableTranslation(
    formatCostP,
    locale,
    responsiveTextSize,
    value.per,
  )

  const permanentValue = getPermanentValueTranslation(
    locale,
    responsiveTextSize,
    value.permanent_value,
  )

  const costWrappedIfMinimum = wrapIfMinimum(
    locale,
    responsiveTextSize,
    value.is_minimum,
    formatCostP(value.value) + perCountable + permanentValue,
  )

  const withNote = appendNoteIfRequested(
    "note",
    value.translations,
    locale.translateMap,
    responsiveTextSize,
    costWrappedIfMinimum,
  )

  const cannotModify = getNonModifiableSuffixTranslation(
    locale.translate,
    entity,
    ModifiableParameter.Cost,
    responsiveTextSize,
  )

  return withNote + cannotModify
}

const getIndefiniteOneTimeCostTranslation = (
  locale: LocaleEnvironment,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: IndefiniteOneTimeCost,
): string =>
  getResponsiveText(
    locale.translateMap(value.translations)?.description,
    responsiveTextSize,
  ) +
  getNonModifiableSuffixTranslation(
    locale.translate,
    entity,
    ModifiableParameter.Cost,
    responsiveTextSize,
  )

const getSingleOneTimeCostTranslation = (
  getInstanceById: GetInstanceById<"SkillModificationLevel">,
  locale: LocaleEnvironment,
  speed: Speed,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: SingleOneTimeCost,
): string => {
  switch (value.kind) {
    case "Modifiable":
      return getModifiableOneTimeCostTranslation(
        getInstanceById,
        locale,
        responsiveTextSize,
        entity,
        speed,
        value.Modifiable,
      )
    case "NonModifiable":
      return getNonModifiableOneTimeCostTranslation(
        locale,
        entity,
        responsiveTextSize,
        value.NonModifiable,
      )
    case "Indefinite":
      return getIndefiniteOneTimeCostTranslation(
        locale,
        entity,
        responsiveTextSize,
        value.Indefinite,
      )
    default:
      return assertExhaustive(value)
  }
}

const getMultipleOneTimeCostsTranslation = (
  type: "conjunction" | "disjunction",
  getInstanceById: GetInstanceById<"SkillModificationLevel">,
  locale: LocaleEnvironment,
  speed: Speed,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: MultipleOneTimeCosts,
): string => {
  const modifiable = !value.every(part => part.kind === "Modifiable")
    ? getNonModifiableSuffixTranslation(
        locale.translate,
        entity,
        ModifiableParameter.Cost,
        responsiveTextSize,
      )
    : ""

  return (
    value
      .map(part =>
        getSingleOneTimeCostTranslation(
          getInstanceById,
          locale,
          speed,
          entity,
          responsiveTextSize,
          part,
        ),
      )
      .join(
        (() => {
          switch (type) {
            case "conjunction":
              return responsive(
                responsiveTextSize,
                () => locale.translate(" and "),
                () => locale.translate(" + "),
              )
            case "disjunction":
              return responsive(
                responsiveTextSize,
                () => locale.translate(" or "),
                () => locale.translate(" / "),
              )
            default:
              return assertExhaustive(type)
          }
        })(),
      ) + modifiable
  )
}

/**
 * Returns the text for a one-time cost map of an activatable skill.
 */
export const getOneTimeCostMapTranslation = (
  translate: Translate,
  translateMap: TranslateMap,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: OneTimeCostMap,
): string =>
  renderResponsiveMap(
    translate,
    translateMap,
    responsiveTextSize,
    value,
    option => option.value,
    bind(formatEnergyByEntity, translate, entity),
    optionTranslation => optionTranslation.label,
    translation => translation.list_prepend,
    translation => translation.list_append,
    translation => translation.replacement,
    value.options.every(option => option.permanent_value !== undefined)
      ? {
          surround: values =>
            translate(", {$value} of which are permanent", {
              value: values,
            }),
          getAdditionalValue: option => option.permanent_value!,
        }
      : undefined,
  ) +
  getNonModifiableSuffixTranslation(
    translate,
    entity,
    ModifiableParameter.Cost,
    responsiveTextSize,
  )

const getSustainedCostMapTranslation = (
  translate: Translate,
  translateMap: TranslateMap,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: SustainedCostMap,
): string => {
  const translation = translateMap(value.translations)

  if (value.translations !== undefined && translation === undefined) {
    return MISSING_VALUE
  }

  if (translation?.replacement !== undefined) {
    const res = getResponsiveTextOptional(
      translation.replacement,
      responsiveTextSize,
    )

    if (res !== undefined) {
      return res
    }
  }

  const labels = value.options
    .map(option => translateMap(option.translations)?.label ?? MISSING_VALUE)
    .join("/")

  const costs = value.options.map(option => option.value).join("/")

  const formatCostP = formatEnergyByEntity.bind(this, translate, entity)

  const notModifiable = getNonModifiableSuffixTranslation(
    translate,
    entity,
    ModifiableParameter.Cost,
    responsiveTextSize,
  )

  return (
    formatCostP(costs) +
    translate(" for ") +
    mapNullableDefault(
      translation?.listPrefix,
      listPrepend => `${listPrepend} `,
      "",
    ) +
    labels +
    (translation?.listSuffix ?? "") +
    notModifiable
  )
}

/**
 * Returns the text for the cost of a one-time activatable skill.
 */
export const getOneTimeCostTranslation = (
  getInstanceById: GetInstanceById<"SkillModificationLevel">,
  locale: LocaleEnvironment,
  speed: Speed,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: OneTimeCost,
): string => {
  switch (value.kind) {
    case "Single":
      return getSingleOneTimeCostTranslation(
        getInstanceById,
        locale,
        speed,
        entity,
        responsiveTextSize,
        value.Single,
      )
    case "Conjunction":
      return getMultipleOneTimeCostsTranslation(
        "conjunction",
        getInstanceById,
        locale,
        speed,
        entity,
        responsiveTextSize,
        value.Conjunction,
      )
    case "Disjunction":
      return getMultipleOneTimeCostsTranslation(
        "disjunction",
        getInstanceById,
        locale,
        speed,
        entity,
        responsiveTextSize,
        value.Disjunction,
      )
    case "Map":
      return getOneTimeCostMapTranslation(
        locale.translate,
        locale.translateMap,
        entity,
        responsiveTextSize,
        value.Map,
      )
    default:
      return assertExhaustive(value)
  }
}

const getModifiableSustainedCostTranslation = (
  getInstanceById: GetInstanceById<"SkillModificationLevel">,
  locale: LocaleEnvironment,
  speed: Speed,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: ModifiableSustainedCost,
) =>
  mapNullable(
    getInstanceById("SkillModificationLevel", value.initial_modification_level),
    modificationLevel => {
      const cost = getModifiableBySpeed(speed, "cost", modificationLevel)

      const formatCostP = formatEnergyByEntity.bind(
        this,
        locale.translate,
        entity,
      )

      const interval = formatTimeSpan(
        locale.translate,
        responsiveTextSize,
        value.interval.unit,
        value.interval.value,
      )

      return responsive(
        responsiveTextSize,
        () =>
          `${formatCostP(cost) + locale.translate(" (casting)")} + ${
            formatCostP(cost / 2) +
            locale.translate(" per {$value}", { value: interval })
          }`,
        () =>
          `${formatCostP(cost)} + ${
            formatCostP(cost / 2) +
            locale.translate("/{$value}", { value: interval })
          }`,
      )
    },
  ) ?? MISSING_VALUE

const getNonModifiableSustainedCostTranslation = (
  locale: LocaleEnvironment,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: NonModifiableSustainedCost,
) => {
  const formatCostP = formatEnergyByEntity.bind(this, locale.translate, entity)

  const per = (() => {
    if (value.per === undefined) {
      return { countable: "", minimumTotal: "" }
    }

    const countable = getResponsiveText(
      locale.translateMap(value.per.translations)?.countable,
      responsiveTextSize,
    )

    const perCountable = responsive(
      responsiveTextSize,
      () => locale.translate(" per {$value}", { value: countable }),
      () => locale.translate("/{$value}", { value: countable }),
    )

    const minimumTotal =
      value.per.minimum_total !== undefined
        ? locale.translate(", minimum of {$value}", {
            value: formatCostP(value.per.minimum_total),
          })
        : ""

    return { countable: perCountable, minimumTotal }
  })()

  const interval = formatTimeSpan(
    locale.translate,
    responsiveTextSize,
    value.interval.unit,
    value.interval.value,
  )

  const cost =
    responsive(
      responsiveTextSize,
      () =>
        `${formatCostP(value.value) + locale.translate(" (casting)")} + ${
          (value.is_minimum === true
            ? locale.translate("half of the activation cost")
            : formatCostP(value.value / 2)) +
          per.countable +
          locale.translate(" per {$value}", { value: interval })
        }`,
      () =>
        `${formatCostP(value.value)} + ${
          (value.is_minimum === true ? "50%" : formatCostP(value.value / 2)) +
          per.countable +
          locale.translate("/{$value}", { value: interval })
        }`,
    ) + per.minimumTotal

  const costWrappedIfMinimum = wrapIfMinimum(
    locale,
    responsiveTextSize,
    value.is_minimum,
    cost,
  )

  return (
    costWrappedIfMinimum +
    getNonModifiableSuffixTranslation(
      locale.translate,
      entity,
      ModifiableParameter.Cost,
      responsiveTextSize,
    )
  )
}

/**
 * Returns the text for the cost of a sustained activatable skill.
 */
export const getSustainedCostTranslation = (
  getInstanceById: GetInstanceById<"SkillModificationLevel">,
  locale: LocaleEnvironment,
  speed: Speed,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: SustainedCost,
): string => {
  switch (value.kind) {
    case "Modifiable":
      return getModifiableSustainedCostTranslation(
        getInstanceById,
        locale,
        speed,
        entity,
        responsiveTextSize,
        value.Modifiable,
      )
    case "NonModifiable":
      return getNonModifiableSustainedCostTranslation(
        locale,
        entity,
        responsiveTextSize,
        value.NonModifiable,
      )
    case "Map":
      return getSustainedCostMapTranslation(
        locale.translate,
        locale.translateMap,
        entity,
        responsiveTextSize,
        value.Map,
      )
    default:
      return assertExhaustive(value)
  }
}

/**
 * Adds the interval to a cost translation if an interval is given, e.g. "10 AE per hour".
 */
export const addCostInterval = (
  translate: Translate,
  responsiveTextSize: ResponsiveTextSize,
  interval: DurationUnitValue | undefined,
  text: string,
) =>
  interval === undefined
    ? text
    : responsiveTranslate(
        translate,
        responsiveTextSize,
        "{$cost} per {$interval}",
        "{$cost}/{$interval}",
        {
          cost: text,
          interval: formatTimeSpan(
            translate,
            responsiveTextSize,
            interval.unit,
            interval.value,
          ),
        },
      )

/**
 * Adds the per countable part to a cost translation if a per countable is given, e.g. "10 AE per target".
 */
export const addPerCountableToCost = (
  responsiveTextSize: ResponsiveTextSize,
  translation: { per?: ResponsiveTextOptional } | undefined,
  text: string,
) => {
  const per = translation?.per
  return per === undefined
    ? text
    : (getResponsiveTextOptional(per, responsiveTextSize) ?? text)
}
