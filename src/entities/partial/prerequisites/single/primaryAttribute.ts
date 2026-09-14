import type { PrimaryAttributePrerequisite } from "@optolith/database-schema/gen"
import type { StdReader } from "../../../../env.js"
import { translateR } from "../../reader.js"
import { printDisplayOption } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a state prerequisite.
 */
export const printPrimaryAttributePrerequisite = (
  prerequisite: PrimaryAttributePrerequisite,
): StdReader<PrerequisitePart | undefined, "t" | "tm"> =>
  prerequisite.display_option !== undefined
    ? printDisplayOption(prerequisite.display_option)
    : translateR("Primary Attribute").map((label): PrerequisitePart | undefined => ({
        label: `${label} `,
        value: prerequisite.value.toFixed(),
        sentenceType: undefined,
        isMeta: false,
      }))
