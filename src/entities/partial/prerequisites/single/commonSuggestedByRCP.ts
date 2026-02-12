import { assertExhaustive } from "@optolith/helpers/typeSafety"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { PrerequisitePart } from "../part.js"

const printType = (
  locale: LocaleEnvironment,
  type: "Advantage" | "Disadvantage",
): string => {
  switch (type) {
    case "Advantage":
      return locale.translate("advantage")
    case "Disadvantage":
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
  name: string,
  type: "Advantage" | "Disadvantage",
): PrerequisitePart | undefined => ({
  value: locale.translate(
    "Race, culture, or profession must have {$entry} as an automatic or suggested {$itemOfCategory}",
    { entry: name, itemOfCategory: printType(locale, type) },
  ),
  sentenceType: undefined,
  isMeta: false,
})
