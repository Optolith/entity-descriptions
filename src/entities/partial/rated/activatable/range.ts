import { mapNullable } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import {
  CheckResultBasedRange,
  FixedRange,
  ModifiableRange,
  Range,
  RangeValue,
} from "optolith-database-schema/types/_ActivatableSkillRange"
import { BlessingRange } from "optolith-database-schema/types/Blessing"
import { CantripRange } from "optolith-database-schema/types/Cantrip"
import { GetById } from "../../../../helpers/getTypes.js"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import {
  appendNoteIfRequested,
  replaceTextIfRequested,
  ResponsiveTextSize,
} from "../../responsiveText.js"
import { formatLength } from "../../units/length.js"
import { MISSING_VALUE } from "../../unknown.js"
import { getCheckResultBasedValueTranslation } from "./checkResultBased.js"
import { Entity } from "./entity.js"
import { wrapIfMaximum } from "./isMinimumMaximum.js"
import {
  getNonModifiableSuffixTranslation,
  ModifiableParameter,
} from "./nonModifiableSuffix.js"
import { getModifiableBySpeed, Speed } from "./speed.js"

const getModifiableRangeTranslation = (
  getSkillModificationLevelById: GetById.Static.SkillModificationLevel,
  locale: LocaleEnvironment,
  speed: Speed,
  responsiveTextSize: ResponsiveTextSize,
  value: ModifiableRange
) =>
  mapNullable(
    getSkillModificationLevelById(value.initial_modification_level),
    (modificationLevel) => {
      const range = getModifiableBySpeed(
        (config) => config.range,
        (config) => config.range,
        speed,
        modificationLevel
      )

      if (range === 1) {
        return locale.translate("Touch")
      }

      return formatLength(locale, responsiveTextSize, "Steps", range)
    }
  ) ?? MISSING_VALUE

const getSightTranslation = (locale: LocaleEnvironment) =>
  locale.translate("Sight")

const getSelfTranslation = (locale: LocaleEnvironment) =>
  locale.translate("Self")

const getGlobalTranslation = (locale: LocaleEnvironment) =>
  locale.translate("Global")

const getTouchTranslation = (
  locale: LocaleEnvironment,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize
) =>
  locale.translate("Touch") +
  getNonModifiableSuffixTranslation(
    locale,
    entity,
    ModifiableParameter.Range,
    responsiveTextSize
  )

const getFixedRangeTranslation = (
  locale: LocaleEnvironment,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: FixedRange
) =>
  formatLength(locale, responsiveTextSize, value.unit, value.value) +
  getNonModifiableSuffixTranslation(
    locale,
    entity,
    ModifiableParameter.Range,
    responsiveTextSize
  )

const wrapIfRadius = (
  locale: LocaleEnvironment,
  is_radius: boolean | undefined,
  text: string
) => (is_radius === true ? `${text} ${locale.translate("Radius")}` : text)

const getCheckResultBasedRangeTranslation = (
  locale: LocaleEnvironment,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: CheckResultBasedRange
) => {
  const range = formatLength(
    locale,
    responsiveTextSize,
    value.unit,
    getCheckResultBasedValueTranslation(locale.translate, value)
  )

  const rangeWrappedIfRadius = wrapIfRadius(locale, value.is_radius, range)

  const rangeWrappedIfRadiusAndIfMaximum = wrapIfMaximum(
    locale,
    responsiveTextSize,
    value.is_maximum,
    rangeWrappedIfRadius
  )

  return (
    rangeWrappedIfRadiusAndIfMaximum +
    getNonModifiableSuffixTranslation(
      locale,
      entity,
      ModifiableParameter.Range,
      responsiveTextSize
    )
  )
}

const getRangeValueTranslation = (
  getSkillModificationLevelById: GetById.Static.SkillModificationLevel,
  locale: LocaleEnvironment,
  speed: Speed,
  responsiveTextSize: ResponsiveTextSize,
  entity: Entity,
  value: RangeValue
) => {
  switch (value.tag) {
    case "Modifiable":
      return getModifiableRangeTranslation(
        getSkillModificationLevelById,
        locale,
        speed,
        responsiveTextSize,
        value.modifiable
      )
    case "Sight":
      return getSightTranslation(locale)
    case "Self":
      return getSelfTranslation(locale)
    case "Global":
      return getGlobalTranslation(locale)
    case "Touch":
      return getTouchTranslation(locale, entity, responsiveTextSize)
    case "Fixed": {
      return getFixedRangeTranslation(
        locale,
        entity,
        responsiveTextSize,
        value.fixed
      )
    }
    case "CheckResultBased":
      return getCheckResultBasedRangeTranslation(
        locale,
        entity,
        responsiveTextSize,
        value.check_result_based
      )
    default:
      return assertExhaustive(value)
  }
}

/**
 * Returns the text for the range of an activatable skill.
 */
export const getTextForActivatableSkillRange = (
  getSkillModificationLevelById: GetById.Static.SkillModificationLevel,
  locale: LocaleEnvironment,
  speed: Speed,
  responsiveTextSize: ResponsiveTextSize,
  entity: Entity,
  value: Range
): string => {
  const rangeValue = getRangeValueTranslation(
    getSkillModificationLevelById,
    locale,
    speed,
    responsiveTextSize,
    entity,
    value.value
  )

  const withReplacement = replaceTextIfRequested(
    "replacement",
    value.translations,
    locale.translateMap,
    responsiveTextSize,
    rangeValue
  )

  return appendNoteIfRequested(
    "note",
    value.translations,
    locale.translateMap,
    responsiveTextSize,
    withReplacement
  )
}

const getTextForTinyAcitvatableRange = (
  locale: LocaleEnvironment,
  responsiveTextSize: ResponsiveTextSize,
  entity: Entity,
  value: CantripRange | BlessingRange
): string => {
  switch (value.tag) {
    case "Self":
      return getSelfTranslation(locale)
    case "Touch":
      return getTouchTranslation(locale, entity, responsiveTextSize)
    case "Fixed":
      return getFixedRangeTranslation(
        locale,
        entity,
        responsiveTextSize,
        value.fixed
      )
    default:
      return assertExhaustive(value)
  }
}

/**
 * Returns the text for the range of a cantrip.
 */
export const getTextForCantripRange = (
  locale: LocaleEnvironment,
  responsiveTextSize: ResponsiveTextSize,
  value: CantripRange
): string =>
  getTextForTinyAcitvatableRange(
    locale,
    responsiveTextSize,
    Entity.Cantrip,
    value
  )

/**
 * Returns the text for the range of a blessing.
 */
export const getTextForBlessingRange = (
  locale: LocaleEnvironment,
  responsiveTextSize: ResponsiveTextSize,
  value: BlessingRange
): string =>
  getTextForTinyAcitvatableRange(
    locale,
    responsiveTextSize,
    Entity.Blessing,
    value
  )
