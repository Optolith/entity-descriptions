import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type { StdReader } from "../../../../env.js"
import { translateR } from "../../reader.js"
import type { PrerequisitePart } from "../part.js"

const printType = (type: "Advantage" | "Disadvantage") => {
  switch (type) {
    case "Advantage":
      return translateR("advantage")
    case "Disadvantage":
      return translateR("disadvantage")
    default:
      return assertExhaustive(type)
  }
}

/**
 * Get the translation of a culture prerequisite.
 */
export const printCommonSuggestedByRCPPrerequisite = (
  name: string,
  type: "Advantage" | "Disadvantage",
): StdReader<PrerequisitePart | undefined, "t"> =>
  printType(type)
    .then(itemOfCategory =>
      translateR(
        "Race, culture, or profession must have {$entry} as an automatic or suggested {$itemOfCategory}",
        { entry: name, itemOfCategory },
      ),
    )
    .map((value): PrerequisitePart | undefined => ({
      value,
      sentenceType: undefined,
      isMeta: false,
    }))
