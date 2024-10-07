import { UI } from "optolith-database-schema/types/UI"
import { LocaleEnvironment } from "../../../helpers/locale.js"
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

const timeSpanUnitTranslationKeys: {
  [key in TimeSpanUnit]: [full: keyof UI, compressed: keyof UI]
} = {
  Seconds: ["{0} seconds", "{0} s"],
  Minutes: ["{0} minutes", "{0} min"],
  Hours: ["{0} hours", "{0} h"],
  Days: ["{0} days", "{0} d"],
  Weeks: ["{0} weeks", "{0} wks."],
  Months: ["{0} months", "{0} mos."],
  Years: ["{0} years", "{0} yrs."],
  Centuries: ["{0} centuries", "{0} cent."],
  Actions: ["{0} actions", "{0} act"],
  CombatRounds: ["{0} combat rounds", "{0} CR"],
  SeductionActions: ["{0} seduction actions", "{0} SA"],
  Rounds: ["{0} rounds", "{0} rnds"],
}

/**
 * Returns the text for a time span unit.
 */
export const formatTimeSpan = (
  locale: LocaleEnvironment,
  responsiveTextSize: ResponsiveTextSize,
  unit: TimeSpanUnit,
  value: number | string,
): string => {
  const [fullKey, compressedKey] = timeSpanUnitTranslationKeys[unit]

  return responsive(
    responsiveTextSize,
    () => locale.translate(fullKey, value),
    () => locale.translate(compressedKey, value),
  )
}
