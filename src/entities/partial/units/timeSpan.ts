import { LocaleEnvironment } from "../../../helpers/locale.js"
import type { Translations } from "../../../helpers/translate.js"
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
    fullNumber: keyof Translations,
    full: keyof Translations,
    compressed: keyof Translations,
  ]
}

/**
 * Returns the text for a time span unit.
 */
export const formatTimeSpan = (
  locale: LocaleEnvironment,
  responsiveTextSize: ResponsiveTextSize,
  unit: { kind: TimeSpanUnit },
  value: number | string,
): string => {
  const [fullNumberKey, fullKey, compressedKey] =
    timeSpanUnitTranslationKeys[unit.kind]

  return responsive(
    responsiveTextSize,
    () =>
      locale.translate(typeof value === "number" ? fullNumberKey : fullKey, {
        value,
      }),
    () => locale.translate(compressedKey, { value }),
  )
}
