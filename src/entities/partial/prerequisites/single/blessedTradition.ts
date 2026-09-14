import type {
  BlessedTraditionPrerequisite,
  BlessedTraditionPrerequisiteRestriction,
} from "@optolith/database-schema/gen"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type { StdReader } from "../../../../env.js"
import { translateR } from "../../reader.js"
import { printDisplayOption } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

const printValue = (restriction: BlessedTraditionPrerequisiteRestriction | undefined) => {
  switch (restriction?.kind) {
    case "Church":
      return translateR("Church").then(tradition =>
        translateR("Tradition ({$tradition})", {
          tradition,
        }),
      )
    case "Shamanistic":
      return translateR("Shaman").then(tradition =>
        translateR("Tradition ({$tradition})", {
          tradition,
        }),
      )
    case undefined:
      return translateR("Tradition")
    default:
      return assertExhaustive(restriction)
  }
}

/**
 * Get the translation of a blessed tradition prerequisite.
 */
export const printBlessedTraditionPrerequisite = (
  prerequisite: BlessedTraditionPrerequisite,
): StdReader<PrerequisitePart | undefined, "t" | "tm"> =>
  prerequisite.display_option !== undefined
    ? printDisplayOption(prerequisite.display_option)
    : translateR("special ability").then(label =>
        printValue(prerequisite.restriction).map((value): PrerequisitePart | undefined => ({
          label: `${label} `,
          value,
          sentenceType: undefined,
          isMeta: false,
        })),
      )
