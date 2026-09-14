import type { PublicationPrerequisite } from "@optolith/database-schema/gen"
import type { StdReader } from "../../../../env.js"
import { attributedNameR } from "../../reader.js"
import { MISSING_VALUE } from "../../unknown.js"
import { printDisplayOption } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a state prerequisite.
 */
export const printPublicationPrerequisite = (
  prerequisite: PublicationPrerequisite,
): StdReader<PrerequisitePart | undefined, "t" | "tm" | "ibi", "Publication"> =>
  prerequisite.display_option !== undefined
    ? printDisplayOption(prerequisite.display_option)
    : attributedNameR("prerequisite", "Publication", prerequisite.id).map(
        (name): PrerequisitePart | undefined => ({
          value: name ?? MISSING_VALUE,
          sentenceType: undefined,
          isMeta: false,
        }),
      )
