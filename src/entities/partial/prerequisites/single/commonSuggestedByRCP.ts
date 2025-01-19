import { assertExhaustive } from "@optolith/helpers/typeSafety"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { PrerequisitePart } from "../part.js"

const printType = (
  locale: LocaleEnvironment,
  type: "advantage" | "disadvantage",
): string => {
  switch (type) {
    case "advantage":
      return locale.translate("advantage")
    case "disadvantage":
      return locale.translate("disadvantage")
    default:
      return assertExhaustive(type)
  }
}

/**
 * Get the translation of a culture prerequisite.
 */
export const printCommonSuggestedByRCPPrerequisite = (
  locale: LocaleEnvironment,
  _prerequisite: Record<string, never>,
  name: string,
  type: "advantage" | "disadvantage",
): PrerequisitePart | undefined => ({
  value: locale.translate(
    "Race, culture, or profession must have {0} as an automatic or suggested {1}",
    name,
    printType(locale, type),
  ),
  sentenceType: undefined,
  isMeta: false,
})
