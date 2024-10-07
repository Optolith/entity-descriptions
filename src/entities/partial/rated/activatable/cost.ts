import { mapNullable, mapNullableDefault } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import {
  CostMap,
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
} from "optolith-database-schema/types/_ActivatableSkillCost"
import { GetById } from "../../../../helpers/getTypes.js"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import {
  appendNoteIfRequested,
  getResponsiveText,
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
  getSkillModificationLevelById: GetById.Static.SkillModificationLevel,
  locale: LocaleEnvironment,
  responsiveTextSize: ResponsiveTextSize,
  entity: Entity,
  speed: Speed,
  value: ModifiableOneTimeCost,
): string =>
  mapNullable(
    getSkillModificationLevelById(value.initial_modification_level),
    modificationLevel => {
      const cost = getModifiableBySpeed(
        config => config.cost,
        config => config.cost,
        speed,
        modificationLevel,
      )

      return replaceTextIfRequested(
        "replacement",
        value.translations,
        locale.translateMap,
        responsiveTextSize,
        formatEnergyByEntity(locale, entity, cost),
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
      () => locale.translate(" per {0}", entity),
      () => locale.translate("/{0}", entity),
    )

    const minimumTotalText =
      mapNullable(perCountable.minimum_total, minimumTotal =>
        locale.translate(", minimum of {0}", formatCost(minimumTotal)),
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
        () => locale.translate(", {0} of which are permanent", permanentValue),
        () => locale.translate(" ({0} perm.)", permanentValue),
      )

const getNonModifiableOneTimeCostTranslation = (
  locale: LocaleEnvironment,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: NonModifiableOneTimeCost,
): string => {
  const formatCostP = formatEnergyByEntity.bind(this, locale, entity)

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
    locale,
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
    locale,
    entity,
    ModifiableParameter.Cost,
    responsiveTextSize,
  )

const getSingleOneTimeCostTranslation = (
  getSkillModificationLevelById: GetById.Static.SkillModificationLevel,
  locale: LocaleEnvironment,
  speed: Speed,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: SingleOneTimeCost,
): string => {
  switch (value.tag) {
    case "Modifiable":
      return getModifiableOneTimeCostTranslation(
        getSkillModificationLevelById,
        locale,
        responsiveTextSize,
        entity,
        speed,
        value.modifiable,
      )
    case "NonModifiable":
      return getNonModifiableOneTimeCostTranslation(
        locale,
        entity,
        responsiveTextSize,
        value.non_modifiable,
      )
    case "Indefinite":
      return getIndefiniteOneTimeCostTranslation(
        locale,
        entity,
        responsiveTextSize,
        value.indefinite,
      )
    default:
      return assertExhaustive(value)
  }
}

const getMultipleOneTimeCostsTranslation = (
  type: "conjunction" | "disjunction",
  getSkillModificationLevelById: GetById.Static.SkillModificationLevel,
  locale: LocaleEnvironment,
  speed: Speed,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: MultipleOneTimeCosts,
): string => {
  const modifiable = !value.every(part => part.tag === "Modifiable")
    ? getNonModifiableSuffixTranslation(
        locale,
        entity,
        ModifiableParameter.Cost,
        responsiveTextSize,
      )
    : ""

  return (
    value
      .map(part =>
        getSingleOneTimeCostTranslation(
          getSkillModificationLevelById,
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

const getCostMapTranslation = (
  locale: LocaleEnvironment,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: CostMap,
): string => {
  const translation = locale.translateMap(value.translations)

  if (value.translations !== undefined && translation === undefined) {
    return MISSING_VALUE
  }

  if (translation?.replacement !== undefined) {
    return translation.replacement
  }

  const labels = value.options
    .map(
      option =>
        locale.translateMap(option.translations)?.label ?? MISSING_VALUE,
    )
    .join("/")

  const costs = value.options.map(option => option.value).join("/")

  const permanentCosts = value.options.every(
    option => option.permanent_value !== undefined,
  )
    ? value.options.map(option => option.permanent_value!).join("/")
    : undefined

  const formatCostP = formatEnergyByEntity.bind(this, locale, entity)

  const notModifiable = getNonModifiableSuffixTranslation(
    locale,
    entity,
    ModifiableParameter.Cost,
    responsiveTextSize,
  )

  return (
    formatCostP(costs) +
    locale.translate(" for ") +
    mapNullableDefault(
      translation?.list_prepend,
      listPrepend => `${listPrepend} `,
      "",
    ) +
    labels +
    (translation?.list_append ?? "") +
    (permanentCosts !== undefined
      ? locale.translate(
          ", {0} of which are permanent",
          formatCostP(permanentCosts),
        )
      : "") +
    notModifiable
  )
}

/**
 * Returns the text for the cost of a one-time activatable skill.
 */
export const getOneTimeCostTranslation = (
  getSkillModificationLevelById: GetById.Static.SkillModificationLevel,
  locale: LocaleEnvironment,
  speed: Speed,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: OneTimeCost,
): string => {
  switch (value.tag) {
    case "Single":
      return getSingleOneTimeCostTranslation(
        getSkillModificationLevelById,
        locale,
        speed,
        entity,
        responsiveTextSize,
        value.single,
      )
    case "Conjunction":
      return getMultipleOneTimeCostsTranslation(
        "conjunction",
        getSkillModificationLevelById,
        locale,
        speed,
        entity,
        responsiveTextSize,
        value.conjunction,
      )
    case "Disjunction":
      return getMultipleOneTimeCostsTranslation(
        "disjunction",
        getSkillModificationLevelById,
        locale,
        speed,
        entity,
        responsiveTextSize,
        value.disjunction,
      )
    case "Map":
      return getCostMapTranslation(
        locale,
        entity,
        responsiveTextSize,
        value.map,
      )
    default:
      return assertExhaustive(value)
  }
}

const getModifiableSustainedCostTranslation = (
  getSkillModificationLevelById: GetById.Static.SkillModificationLevel,
  locale: LocaleEnvironment,
  speed: Speed,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: ModifiableSustainedCost,
) =>
  mapNullable(
    getSkillModificationLevelById(value.initial_modification_level),
    modificationLevel => {
      const cost = getModifiableBySpeed(
        config => config.cost,
        config => config.cost,
        speed,
        modificationLevel,
      )

      const formatCostP = formatEnergyByEntity.bind(this, locale, entity)

      const interval = formatTimeSpan(
        locale,
        responsiveTextSize,
        value.interval.unit,
        value.interval.value,
      )

      return responsive(
        responsiveTextSize,
        () =>
          `${formatCostP(cost) + locale.translate(" (casting)")} + ${
            formatCostP(cost / 2) + locale.translate(" per {0}", interval)
          }`,
        () =>
          `${formatCostP(cost)} + ${
            formatCostP(cost / 2) + locale.translate("/{0}", interval)
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
  const formatCostP = formatEnergyByEntity.bind(this, locale, entity)

  const per = (() => {
    if (value.per === undefined) {
      return { countable: "", minimumTotal: "" }
    }

    const countable = responsive(
      responsiveTextSize,
      entity => locale.translate(" per {0}", entity),
      entity => locale.translate("/{0}", entity),
      getResponsiveText(
        locale.translateMap(value.per.translations)?.countable,
        responsiveTextSize,
      ),
    )

    const minimumTotal =
      value.per.minimum_total !== undefined
        ? locale.translate(
            ", minimum of {0}",
            formatCostP(value.per.minimum_total),
          )
        : ""

    return { countable, minimumTotal }
  })()

  const interval = formatTimeSpan(
    locale,
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
          locale.translate(" per {0}", interval)
        }`,
      () =>
        `${formatCostP(value.value)} + ${
          (value.is_minimum === true ? "50%" : formatCostP(value.value / 2)) +
          per.countable +
          locale.translate("/{0}", interval)
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
      locale,
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
  getSkillModificationLevelById: GetById.Static.SkillModificationLevel,
  locale: LocaleEnvironment,
  speed: Speed,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: SustainedCost,
): string => {
  switch (value.tag) {
    case "Modifiable":
      return getModifiableSustainedCostTranslation(
        getSkillModificationLevelById,
        locale,
        speed,
        entity,
        responsiveTextSize,
        value.modifiable,
      )
    case "NonModifiable":
      return getNonModifiableSustainedCostTranslation(
        locale,
        entity,
        responsiveTextSize,
        value.non_modifiable,
      )
    default:
      return assertExhaustive(value)
  }
}
