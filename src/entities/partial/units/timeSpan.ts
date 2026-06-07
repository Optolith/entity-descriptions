import { Reader } from "@elyukai/utils/reader"
import type { Translate, TranslationKeyMatchingParams } from "../../../helpers/translate.js"
import type { StdEnv } from "../reader.js"
import { type ResponsiveTextSize, responsive } from "../responsiveText.js"

/**
 * Possible units to use for time spans.
 */
export type TimeSpanUnit =
  | "Seconds"
  | "Minutes"
  | "Hours"
  | "Days"
  | "Weeks"
  | "Months"
  | "Years"
  | "Centuries"
  | "Actions"
  | "CombatRounds"
  | "SeductionActions"
  | "Rounds"

// prettier-ignore
const timeSpanUnitTranslationKeys = {
  Seconds: [".input {$value :number} .input {$style :string} {{{$value} seconds}}", "{$value} seconds", ".input {$value :number} .input {$style :string} {{{$value} s}}", "{$value} s"],
  Minutes: [".input {$value :number} .input {$style :string} {{{$value} minutes}}", "{$value} minutes", ".input {$value :number} .input {$style :string} {{{$value} min}}", "{$value} min"],
  Hours: [".input {$value :number} .input {$style :string} {{{$value} hours}}", "{$value} hours", ".input {$value :number} .input {$style :string} {{{$value} h}}", "{$value} h"],
  Days: [".input {$value :number} .input {$style :string} {{{$value} days}}", "{$value} days", ".input {$value :number} .input {$style :string} {{{$value} d}}", "{$value} d"],
  Weeks: [".input {$value :number} .input {$style :string} {{{$value} weeks}}", "{$value} weeks", ".input {$value :number} .input {$style :string} {{{$value} wks.}}", "{$value} wks."],
  Months: [".input {$value :number} .input {$style :string} {{{$value} months}}", "{$value} months", ".input {$value :number} .input {$style :string} {{{$value} mos.}}", "{$value} mos."],
  Years: [".input {$value :number} .input {$style :string} {{{$value} years}}", "{$value} years", ".input {$value :number} .input {$style :string} {{{$value} yrs.}}", "{$value} yrs."],
  Centuries: [".input {$value :number} .input {$style :string} {{{$value} centuries}}", "{$value} centuries", ".input {$value :number} .input {$style :string} {{{$value} cent.}}", "{$value} cent."],
  Actions: [".input {$value :number} .input {$style :string} {{{$value} actions}}", "{$value} actions", ".input {$value :number} .input {$style :string} {{{$value} act}}", "{$value} act"],
  CombatRounds: [".input {$value :number} .input {$style :string} {{{$value} combat rounds}}", "{$value} combat rounds", ".input {$value :number} .input {$style :string} {{{$value} CR}}", "{$value} CR"],
  SeductionActions: [".input {$value :number} .input {$style :string} {{{$value} seduction actions}}", "{$value} seduction actions", ".input {$value :number} .input {$style :string} {{{$value} SA}}", "{$value} SA"],
  Rounds: [".input {$value :number} .input {$style :string} {{{$value} rounds}}", "{$value} rounds", ".input {$value :number} .input {$style :string} {{{$value} rnds}}", "{$value} rnds"],
} as const satisfies {
  [key in TimeSpanUnit]: [
    fullNumber: TranslationKeyMatchingParams<{ value: number, style: string }>,
    full: TranslationKeyMatchingParams<{ value: string }>,
    compressedNumber: TranslationKeyMatchingParams<{ value: number , style: string }>,
    compressed: TranslationKeyMatchingParams<{ value: string  }>,
  ]
}

/**
 * Returns the text for a time span unit.
 */
export const formatTimeSpan = (
  translate: Translate,
  responsiveTextSize: ResponsiveTextSize,
  unit: { kind: TimeSpanUnit } | TimeSpanUnit,
  value: number | string,
  interval = false,
): string => {
  const [fullNumberKey, fullKey, compressedNumberKey, compressedKey] =
    timeSpanUnitTranslationKeys[typeof unit === "string" ? unit : unit.kind]

  return responsive(
    responsiveTextSize,
    () =>
      translate(typeof value === "number" ? fullNumberKey : fullKey, {
        value,
        style: interval ? "interval" : "default",
      }),
    () =>
      translate(typeof value === "number" ? compressedNumberKey : compressedKey, {
        value,
        style: interval ? "interval" : "default",
      }),
  )
}

/**
 * Returns the text for a time span unit.
 */
export const formatCombinedTimeSpan = (
  translate: Translate,
  responsiveTextSize: ResponsiveTextSize,
  object: {
    unit: { kind: TimeSpanUnit }
    value: number | string
  },
  interval = false,
): string => formatTimeSpan(translate, responsiveTextSize, object.unit, object.value, interval)

/**
 * Returns the text for a time span unit.
 */
export const formatTimeSpanR = (
  unit: { kind: TimeSpanUnit } | TimeSpanUnit,
  value: number | string,
  interval?: boolean,
): Reader<StdEnv<"t" | "rts">, string> =>
  Reader.asks(({ translate, responsiveTextSize }) =>
    formatTimeSpan(translate, responsiveTextSize, unit, value, interval),
  )
/**
 * Returns the text for a time span unit.
 */
export const formatCombinedTimeSpanR = (
  object: {
    unit: { kind: TimeSpanUnit }
    value: number | string
  },
  interval?: boolean,
): Reader<StdEnv<"t" | "rts">, string> => formatTimeSpanR(object.unit, object.value, interval)
