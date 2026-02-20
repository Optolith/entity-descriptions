import { Reader } from "@elyukai/utils/reader"
import type {
  Translate,
  TranslationKeyMatchingParams,
} from "../../../helpers/translate.js"
import type { StdEnv } from "../reader.js"
import { ResponsiveTextSize, responsive } from "../responsiveText.js"

type TimeSpanUnit =
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
  Seconds: [".input {$value :number} {{{$value} seconds}}", "{$value} seconds", "{$value} s"],
  Minutes: [".input {$value :number} {{{$value} minutes}}", "{$value} minutes", "{$value} min"],
  Hours: [".input {$value :number} {{{$value} hours}}", "{$value} hours", "{$value} h"],
  Days: [".input {$value :number} {{{$value} days}}", "{$value} days", "{$value} d"],
  Weeks: [".input {$value :number} {{{$value} weeks}}", "{$value} weeks", ".input {$value :number} {{{$value} wks.}}"],
  Months: [".input {$value :number} {{{$value} months}}", "{$value} months", ".input {$value :number} {{{$value} mos.}}"],
  Years: [".input {$value :number} {{{$value} years}}", "{$value} years", ".input {$value :number} {{{$value} yrs.}}"],
  Centuries: [".input {$value :number} {{{$value} centuries}}", "{$value} centuries", "{$value} cent."],
  Actions: [".input {$value :number} {{{$value} actions}}", "{$value} actions", "{$value} act"],
  CombatRounds: [".input {$value :number} {{{$value} combat rounds}}", "{$value} combat rounds", "{$value} CR"],
  SeductionActions: [".input {$value :number} {{{$value} seduction actions}}", "{$value} seduction actions", "{$value} SA"],
  Rounds: [".input {$value :number} {{{$value} rounds}}", "{$value} rounds", "{$value} rnds"],
} as const satisfies {
  [key in TimeSpanUnit]: [
    fullNumber: TranslationKeyMatchingParams<{ value: number }>,
    full: TranslationKeyMatchingParams<{ value: number }>,
    compressed: TranslationKeyMatchingParams<{ value: number }>,
  ]
}

/**
 * Returns the text for a time span unit.
 */
export const formatTimeSpan = (
  translate: Translate,
  responsiveTextSize: ResponsiveTextSize,
  unit: { kind: TimeSpanUnit },
  value: number | string,
): string => {
  const [fullNumberKey, fullKey, compressedKey] =
    timeSpanUnitTranslationKeys[unit.kind]

  return responsive(
    responsiveTextSize,
    () =>
      translate(typeof value === "number" ? fullNumberKey : fullKey, {
        value,
      }),
    () => translate(compressedKey, { value }),
  )
}

/**
 * Returns the text for a time span unit.
 */
export const formatTimeSpanR = (
  unit: { kind: TimeSpanUnit },
  value: number | string,
): Reader<StdEnv<"t" | "rts">, string> =>
  Reader.asks(({ translate, responsiveTextSize }) =>
    formatTimeSpan(translate, responsiveTextSize, unit, value),
  )
/**
 * Returns the text for a time span unit.
 */
export const formatCombinedTimeSpanR = (object: {
  unit: { kind: TimeSpanUnit }
  value: number | string
}): Reader<StdEnv<"t" | "rts">, string> =>
  formatTimeSpanR(object.unit, object.value)
