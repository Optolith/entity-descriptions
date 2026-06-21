import { Reader } from "@elyukai/utils/reader"
import type {
  CastingTimeDuringLovemaking,
  DurationForSustained,
  ExpressionBasedDuration,
  Immediate,
  MusicDuration,
  PermanentDuration,
  ResponsiveText,
} from "@optolith/database-schema/gen"
import { mapNullable } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import { Case } from "../../../../helpers/enums.js"
import type { LocaleMap } from "../../../../helpers/translate.js"
import {
  responsiveTextR,
  responsiveTranslateR,
  translateMapR,
  translateR,
  type StdReader,
} from "../../reader.js"
import { replaceTextIfNeeded } from "../../responsiveText.js"
import { formatCombinedTimeSpanR, formatTimeSpanR } from "../../units/timeSpan.js"
import { MISSING_VALUE } from "../../unknown.js"
import { renderExpressionBasedParameterValue } from "./checkResultBased.js"
import { wrapAsMaximum, wrapIfMaximum } from "./isMinimumMaximum.js"
import { appendInParensIfNotEmpty } from "./parensIf.js"

const renderImmediateDuration = (value?: Immediate): StdReader<string, "t" | "tm" | "rts"> =>
  translateR("Immediate")
    .thenW(
      base =>
        mapNullable(value?.maximum, max =>
          formatTimeSpanR(max.unit, max.value)
            .then(wrapAsMaximum)
            .map(maxText => appendInParensIfNotEmpty(maxText, base)),
        ) ?? Reader.of(base),
    )
    .thenW(text => replaceTextIfNeeded(value?.translations, text))

const renderPermanentDuration = (value: PermanentDuration): StdReader<string, "t" | "tm" | "rts"> =>
  translateR("Permanent").thenW(text => replaceTextIfNeeded(value.translations, text))

/**
 * Returns the text for a duration that is based on an expression.
 */
export const renderExpressionBasedDuration = (
  value: ExpressionBasedDuration,
): StdReader<string, "t" | "tm" | "rts"> =>
  renderExpressionBasedParameterValue(value.value)
    .thenW(expressionValue => formatTimeSpanR(value.unit, expressionValue))
    .then(text => wrapIfMaximum(value.is_maximum, text).map(wrapped => [wrapped, text] as const))
    .thenW(([wrapped, text]) => replaceTextIfNeeded(value.translations, wrapped, text))

const renderIndefiniteDuration = (value: {
  maximum?: OneTimeDuration
  translations: LocaleMap<{
    description: ResponsiveText | string
  }>
}): StdReader<string, "t" | "tm" | "rts"> => {
  const { maximum, translations } = value
  return translateMapR<{
    description: ResponsiveText | string
  }>(translations)
    .thenW(translation =>
      typeof translation?.description === "object"
        ? responsiveTextR(translation.description)
        : Reader.of(translation?.description ?? MISSING_VALUE),
    )
    .thenW(
      maximum === undefined
        ? text => Reader.of(text)
        : text =>
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            renderOneTimeDuration(maximum).then(maximumText =>
              translateR("{$defaultDuration}, but no more than {$maximumDuration}", {
                defaultDuration: text,
                maximumDuration: maximumText,
              }),
            ),
    )
}

const renderDurationDuringLovemaking = (
  value: CastingTimeDuringLovemaking,
): StdReader<string, "t" | "rts"> => formatCombinedTimeSpanR(value)

type OneTimeDuration =
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
      Fixed: Omit<ExpressionBasedDuration, "value"> & { value: number }
    }
  | {
      kind: "Expression"
      Expression: ExpressionBasedDuration
    }
  | {
      kind: "Indefinite"
      Indefinite: {
        maximum?: OneTimeDuration
        translations: LocaleMap<{
          description: ResponsiveText | string
        }>
      }
    }
  // used for cantrips:
  | {
      kind: "DuringLovemaking"
      DuringLovemaking: CastingTimeDuringLovemaking
    }

/**
 * Returns the text for the duration of a one-time activatable skill.
 */
export const renderOneTimeDuration = (
  value: OneTimeDuration,
): StdReader<string, "t" | "tm" | "rts"> => {
  switch (value.kind) {
    case "Immediate":
      return renderImmediateDuration(value.Immediate)
    case "Permanent":
      return renderPermanentDuration(value.Permanent)
    case "Fixed":
      return renderExpressionBasedDuration({
        ...value.Fixed,
        value: Case("Value", Case("Constant", value.Fixed.value)),
      })
    case "Expression":
      return renderExpressionBasedDuration(value.Expression)
    case "Indefinite":
      return renderIndefiniteDuration(value.Indefinite)
    case "DuringLovemaking":
      return renderDurationDuringLovemaking(value.DuringLovemaking)
    default:
      return assertExhaustive(value)
  }
}

/**
 * Returns the text for the duration of a sustained activatable skill.
 */
export const renderSustainedDuration = (
  value: DurationForSustained | undefined,
): StdReader<string, "t" | "rts"> =>
  value === undefined
    ? responsiveTranslateR("Sustained", "(S)")
    : formatCombinedTimeSpanR(value.maximum).then(maxText => wrapAsMaximum(maxText))

/**
 *  Returns the text for the duration of a musical activatable skill.
 */
export const renderMusicDuration = (duration: MusicDuration): StdReader<string, "t"> =>
  Reader.asks(({ translate }) => {
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
  })
