import type {
  MagicalTraditionPrerequisite,
  MagicalTraditionPrerequisiteRestriction,
} from "@optolith/database-schema/gen"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type { StdReader } from "../../../../env.js"
import { translateR } from "../../reader.js"
import { printDisplayOption } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

const printValue = (restriction: MagicalTraditionPrerequisiteRestriction | undefined) => {
  switch (restriction?.kind) {
    case "CanLearnRituals":
      return translateR("Tradition must be able to use rituals")
    case "CanBindFamiliars":
      return translateR("Tradition must be able to bind familiars")
    case undefined:
      return translateR("Tradition")
    default:
      return assertExhaustive(restriction)
  }
}

/**
 * Get the translation of a magical tradition prerequisite.
 */
export const printMagicalTraditionPrerequisite = (
  prerequisite: MagicalTraditionPrerequisite,
): StdReader<PrerequisitePart | undefined, "t" | "tm"> =>
  prerequisite.display_option !== undefined
    ? printDisplayOption(prerequisite.display_option)
    : printValue(prerequisite.restriction).map((value): PrerequisitePart | undefined => ({
        value,
        sentenceType: undefined,
        isMeta: false,
      }))
