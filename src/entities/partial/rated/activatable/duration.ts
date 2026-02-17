import { mapNullable } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type {
  BlessingDuration,
  CantripDuration,
  CastingTimeDuringLovemaking,
  CheckResultBasedDuration,
  DurationForSustained,
  FixedDuration,
  Immediate,
  IndefiniteBlessingDuration,
  IndefiniteBlessingDurationTranslation,
  IndefiniteDuration,
  IndefiniteDurationTranslation,
  PermanentDuration,
} from "optolith-database-schema/gen"
import type { Translate, TranslateMap } from "../../../../helpers/translate.js"
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
  translate: Translate,
  translateMap: TranslateMap,
  responsiveTextSize: ResponsiveTextSize,
  value?: Immediate,
): string => {
  const text = appendInParensIfNotEmpty(
    mapNullable(value?.maximum, max => {
      const maxText = formatTimeSpan(
        translate,
        responsiveTextSize,
        max.unit,
        max.value,
      )

      return responsive(
        responsiveTextSize,
        () => translate("no more than {$value}", { value: maxText }),
        () => translate("max. {$value}", { value: maxText }),
      )
    }),
    translate("Immediate"),
  )

  return replaceTextIfRequested(
    "replacement",
    value?.translations,
    translateMap,
    responsiveTextSize,
    text,
  )
}

const getPermanentDurationTranslation = (
  translate: Translate,
  translateMap: TranslateMap,
  responsiveTextSize: ResponsiveTextSize,
  value: PermanentDuration,
): string =>
  replaceTextIfRequested(
    "replacement",
    value.translations,
    translateMap,
    responsiveTextSize,
    translate("Permanent"),
  )

const getFixedDurationTranslation = (
  translate: Translate,
  translateMap: TranslateMap,
  responsiveTextSize: ResponsiveTextSize,
  value: FixedDuration,
): string => {
  const duration = formatTimeSpan(
    translate,
    responsiveTextSize,
    value.unit,
    value.value,
  )

  const durationWrappedIfMaximum = wrapIfMaximum(
    translate,
    responsiveTextSize,
    value.is_maximum,
    duration,
  )

  return replaceTextIfRequested(
    "replacement",
    value.translations,
    translateMap,
    responsiveTextSize,
    durationWrappedIfMaximum,
  )
}

const getCheckResultBasedDurationTranslation = (
  translate: Translate,
  responsiveTextSize: ResponsiveTextSize,
  value: CheckResultBasedDuration,
): string => {
  const duration = formatTimeSpan(
    translate,
    responsiveTextSize,
    value.unit,
    getCheckResultBasedValueTranslation(translate, value),
  )

  return wrapIfMaximum(
    translate,
    responsiveTextSize,
    value.is_maximum,
    duration,
  )
}

const getIndefiniteDurationTranslation = (
  translateMap: TranslateMap,
  responsiveTextSize: ResponsiveTextSize,
  value: IndefiniteDuration | IndefiniteBlessingDuration,
) => {
  const description = translateMap<
    IndefiniteDurationTranslation | IndefiniteBlessingDurationTranslation
  >(value.translations)?.description

  return typeof description === "string"
    ? description
    : getResponsiveText(description, responsiveTextSize)
}

/**
 * Returns the text for the duration of a one-time activatable skill.
 */
export const getDurationForOneTimeTranslation = (
  translate: Translate,
  translateMap: TranslateMap,
  responsiveTextSize: ResponsiveTextSize,
  value:
    | {
        kind: "Immediate"
        Immediate?: Immediate
      }
    | {
        kind: "Permanent"
        Permanent: PermanentDuration
      }
    | {
        kind: "Fixed"
        Fixed: FixedDuration
      }
    | {
        kind: "CheckResultBased"
        CheckResultBased: CheckResultBasedDuration
      }
    | {
        kind: "Indefinite"
        Indefinite: IndefiniteDuration
      },
): string => {
  switch (value.kind) {
    case "Immediate":
      return getImmediateDurationTranslation(
        translate,
        translateMap,
        responsiveTextSize,
        value.Immediate,
      )
    case "Permanent":
      return getPermanentDurationTranslation(
        translate,
        translateMap,
        responsiveTextSize,
        value.Permanent,
      )
    case "Fixed":
      return getFixedDurationTranslation(
        translate,
        translateMap,
        responsiveTextSize,
        value.Fixed,
      )
    case "CheckResultBased":
      return getCheckResultBasedDurationTranslation(
        translate,
        responsiveTextSize,
        value.CheckResultBased,
      )
    case "Indefinite":
      return getIndefiniteDurationTranslation(
        translateMap,
        responsiveTextSize,
        value.Indefinite,
      )
    default:
      return assertExhaustive(value)
  }
}

/**
 * Returns the text for the duration of a sustained activatable skill.
 */
export const getDurationForSustainedTranslation = (
  translate: Translate,
  responsiveTextSize: ResponsiveTextSize,
  value: DurationForSustained | undefined,
): string =>
  value === undefined
    ? responsive(
        responsiveTextSize,
        () => translate("Sustained"),
        () => translate("(S)"),
      )
    : wrapAsMaximum(
        translate,
        responsiveTextSize,
        formatTimeSpan(
          translate,
          responsiveTextSize,
          value.maximum.unit,
          value.maximum.value,
        ),
      )

const getDurationDuringLovemakingTranslation = (
  translate: Translate,
  responsiveTextSize: ResponsiveTextSize,
  value: CastingTimeDuringLovemaking,
): string =>
  formatTimeSpan(translate, responsiveTextSize, value.unit, value.value)

/**
 * Returns the text for the duration of a cantrip.
 */
export const getDurationTranslationForCantrip = (
  translate: Translate,
  translateMap: TranslateMap,
  responsiveTextSize: ResponsiveTextSize,
  value: CantripDuration,
): string => {
  switch (value.kind) {
    case "Immediate":
      return getImmediateDurationTranslation(
        translate,
        translateMap,
        responsiveTextSize,
        {},
      )
    case "Fixed":
      return getFixedDurationTranslation(
        translate,
        translateMap,
        responsiveTextSize,
        value.Fixed,
      )
    case "Indefinite":
      return getIndefiniteDurationTranslation(
        translateMap,
        responsiveTextSize,
        value.Indefinite,
      )
    case "DuringLovemaking":
      return getDurationDuringLovemakingTranslation(
        translate,
        responsiveTextSize,
        value.DuringLovemaking,
      )
    default:
      return assertExhaustive(value)
  }
}

/**
 * Returns the text for the duration of a blessing.
 */
export const getDurationTranslationForBlessing = (
  translate: Translate,
  translateMap: TranslateMap,
  responsiveTextSize: ResponsiveTextSize,
  value: BlessingDuration,
): string => {
  switch (value.kind) {
    case "Immediate":
      return getImmediateDurationTranslation(
        translate,
        translateMap,
        responsiveTextSize,
        {},
      )
    case "Fixed":
      return getFixedDurationTranslation(
        translate,
        translateMap,
        responsiveTextSize,
        value.Fixed,
      )
    case "Indefinite":
      return getIndefiniteDurationTranslation(
        translateMap,
        responsiveTextSize,
        value.Indefinite,
      )
    default:
      return assertExhaustive(value)
  }
}
