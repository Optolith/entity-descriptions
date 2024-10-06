import { mapNullable } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import { CastingTimeDuringLovemaking } from "optolith-database-schema/types/_ActivatableSkillCastingTime"
import {
  CheckResultBasedDuration,
  DurationForOneTime,
  DurationForSustained,
  FixedDuration,
  Immediate,
  IndefiniteDuration,
  PermanentDuration,
} from "optolith-database-schema/types/_ActivatableSkillDuration"
import { BlessingDuration } from "optolith-database-schema/types/Blessing"
import { CantripDuration } from "optolith-database-schema/types/Cantrip"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import {
  getResponsiveText,
  replaceTextIfRequested,
  responsive,
  ResponsiveTextSize,
} from "../../responsiveText.js"
import { formatTimeSpan } from "../../units/timeSpan.js"
import { getCheckResultBasedValueTranslation } from "./checkResultBased.js"
import { wrapAsMaximum, wrapIfMaximum } from "./isMinimumMaximum.js"
import { appendInParensIfNotEmpty } from "./parensIf.js"

const getImmediateDurationTranslation = (
  locale: LocaleEnvironment,
  responsiveTextSize: ResponsiveTextSize,
  value: Immediate
): string => {
  const text = appendInParensIfNotEmpty(
    mapNullable(value.maximum, (max) => {
      const maxText = formatTimeSpan(
        locale,
        responsiveTextSize,
        max.unit,
        max.value
      )

      return responsive(
        responsiveTextSize,
        () => locale.translate("no more than {0}", maxText),
        () => locale.translate("max. {0}", maxText)
      )
    }),
    locale.translate("Immediate")
  )

  return replaceTextIfRequested(
    "replacement",
    value.translations,
    locale.translateMap,
    responsiveTextSize,
    text
  )
}

const getPermanentDurationTranslation = (
  locale: LocaleEnvironment,
  responsiveTextSize: ResponsiveTextSize,
  value: PermanentDuration
): string =>
  replaceTextIfRequested(
    "replacement",
    value.translations,
    locale.translateMap,
    responsiveTextSize,
    locale.translate("Permanent")
  )

const getFixedDurationTranslation = (
  locale: LocaleEnvironment,
  responsiveTextSize: ResponsiveTextSize,
  value: FixedDuration
): string => {
  const duration = formatTimeSpan(
    locale,
    responsiveTextSize,
    value.unit,
    value.value
  )

  const durationWrappedIfMaximum = wrapIfMaximum(
    locale,
    responsiveTextSize,
    value.is_maximum,
    duration
  )

  return replaceTextIfRequested(
    "replacement",
    value.translations,
    locale.translateMap,
    responsiveTextSize,
    durationWrappedIfMaximum
  )
}

const getCheckResultBasedDurationTranslation = (
  locale: LocaleEnvironment,
  responsiveTextSize: ResponsiveTextSize,
  value: CheckResultBasedDuration
): string => {
  const duration = formatTimeSpan(
    locale,
    responsiveTextSize,
    value.unit,
    getCheckResultBasedValueTranslation(locale.translate, value)
  )

  return wrapIfMaximum(locale, responsiveTextSize, value.is_maximum, duration)
}

const getIndefiniteDurationTranslation = (
  locale: LocaleEnvironment,
  responsiveTextSize: ResponsiveTextSize,
  value: IndefiniteDuration
) =>
  getResponsiveText(
    locale.translateMap(value.translations)?.description,
    responsiveTextSize
  )

/**
 * Returns the text for the duration of a one-time activatable skill.
 */
export const getDurationForOneTimeTranslation = (
  locale: LocaleEnvironment,
  responsiveTextSize: ResponsiveTextSize,
  value: DurationForOneTime
): string => {
  switch (value.tag) {
    case "Immediate":
      return getImmediateDurationTranslation(
        locale,
        responsiveTextSize,
        value.immediate
      )
    case "Permanent":
      return getPermanentDurationTranslation(
        locale,
        responsiveTextSize,
        value.permanent
      )
    case "Fixed":
      return getFixedDurationTranslation(
        locale,
        responsiveTextSize,
        value.fixed
      )
    case "CheckResultBased":
      return getCheckResultBasedDurationTranslation(
        locale,
        responsiveTextSize,
        value.check_result_based
      )
    case "Indefinite":
      return getIndefiniteDurationTranslation(
        locale,
        responsiveTextSize,
        value.indefinite
      )
    default:
      return assertExhaustive(value)
  }
}

/**
 * Returns the text for the duration of a sustained activatable skill.
 */
export const getDurationForSustainedTranslation = (
  locale: LocaleEnvironment,
  responsiveTextSize: ResponsiveTextSize,
  value: DurationForSustained | undefined
): string =>
  value === undefined
    ? responsive(
        responsiveTextSize,
        () => locale.translate("Sustained"),
        () => locale.translate("(S)")
      )
    : wrapAsMaximum(
        locale,
        responsiveTextSize,
        formatTimeSpan(
          locale,
          responsiveTextSize,
          value.maximum.unit,
          value.maximum.value
        )
      )

const getDurationDuringLovemakingTranslation = (
  locale: LocaleEnvironment,
  responsiveTextSize: ResponsiveTextSize,
  value: CastingTimeDuringLovemaking
): string => formatTimeSpan(locale, responsiveTextSize, value.unit, value.value)

/**
 * Returns the text for the duration of a cantrip.
 */
export const getDurationTranslationForCantrip = (
  locale: LocaleEnvironment,
  responsiveTextSize: ResponsiveTextSize,
  value: CantripDuration
): string => {
  switch (value.tag) {
    case "Immediate":
      return getImmediateDurationTranslation(
        locale,
        responsiveTextSize,
        value.immediate
      )
    case "Fixed":
      return getFixedDurationTranslation(
        locale,
        responsiveTextSize,
        value.fixed
      )
    case "Indefinite":
      return getIndefiniteDurationTranslation(
        locale,
        responsiveTextSize,
        value.indefinite
      )
    case "DuringLovemaking":
      return getDurationDuringLovemakingTranslation(
        locale,
        responsiveTextSize,
        value.during_lovemaking
      )
    default:
      return assertExhaustive(value)
  }
}

/**
 * Returns the text for the duration of a blessing.
 */
export const getDurationTranslationForBlessing = (
  locale: LocaleEnvironment,
  responsiveTextSize: ResponsiveTextSize,
  value: BlessingDuration
): string => {
  switch (value.tag) {
    case "Immediate":
      return getImmediateDurationTranslation(
        locale,
        responsiveTextSize,
        value.immediate
      )
    case "Fixed":
      return getFixedDurationTranslation(
        locale,
        responsiveTextSize,
        value.fixed
      )
    case "Indefinite":
      return getIndefiniteDurationTranslation(
        locale,
        responsiveTextSize,
        value.indefinite
      )
    default:
      return assertExhaustive(value)
  }
}
