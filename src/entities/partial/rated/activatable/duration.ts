import { Reader } from "@elyukai/utils/reader"
import { mapNullable } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type {
  CastingTimeDuringLovemaking,
  CheckResultBasedDuration,
  DurationForSustained,
  FixedDuration,
  Immediate,
  MusicDuration,
  PermanentDuration,
  ResponsiveText,
} from "optolith-database-schema/gen"
import type { LocaleMap } from "../../../../helpers/translate.js"
import {
  responsiveTextR,
  responsiveTranslateR,
  translateMapR,
  translateR,
  type StdReader,
} from "../../reader.js"
import { replaceTextIfNeeded } from "../../responsiveText.js"
import {
  formatCombinedTimeSpanR,
  formatTimeSpanR,
} from "../../units/timeSpan.js"
import { MISSING_VALUE } from "../../unknown.js"
import { renderCheckResultBasedValue } from "./checkResultBased.js"
import { wrapAsMaximum, wrapIfMaximum } from "./isMinimumMaximum.js"
import { appendInParensIfNotEmpty } from "./parensIf.js"

const renderImmediateDuration = (
  value?: Immediate,
): StdReader<string, "t" | "tm" | "rts"> =>
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

const renderPermanentDuration = (
  value: PermanentDuration,
): StdReader<string, "t" | "tm" | "rts"> =>
  translateR("Permanent").thenW(text =>
    replaceTextIfNeeded(value.translations, text),
  )

const renderFixedDuration = (
  value: FixedDuration,
): StdReader<string, "t" | "tm" | "rts"> =>
  formatCombinedTimeSpanR(value)
    .then(text => wrapIfMaximum(value.is_maximum, text))
    .thenW(text => replaceTextIfNeeded(value.translations, text))

const renderCheckResultBasedDuration = (
  value: CheckResultBasedDuration,
): StdReader<string, "t" | "tm" | "rts"> =>
  renderCheckResultBasedValue(value)
    .thenW(text => formatTimeSpanR(value.unit, text))
    .then(text => wrapIfMaximum(value.is_maximum, text))

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
        ? Reader.of
        : text =>
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            renderOneTimeDuration(maximum).then(maximumText =>
              translateR(
                "{$defaultDuration}, but no more than {$maximumDuration}",
                {
                  defaultDuration: text,
                  maximumDuration: maximumText,
                },
              ),
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
      Fixed: FixedDuration
    }
  | {
      kind: "CheckResultBased"
      CheckResultBased: CheckResultBasedDuration
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
      return renderFixedDuration(value.Fixed)
    case "CheckResultBased":
      return renderCheckResultBasedDuration(value.CheckResultBased)
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
    : formatCombinedTimeSpanR(value.maximum).then(maxText =>
        wrapAsMaximum(maxText),
      )

/**
 *  Returns the text for the duration of a musical activatable skill.
 */
export const renderMusicDuration = (
  duration: MusicDuration,
): StdReader<string, "t"> =>
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
