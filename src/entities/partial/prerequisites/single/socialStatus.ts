import type { SocialStatusPrerequisite } from "@optolith/database-schema/gen"
import type { StdReader } from "../../../../env.js"
import { attributedNameR, translateR } from "../../reader.js"
import { MISSING_VALUE } from "../../unknown.js"
import { printDisplayOption } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a social status prerequisite.
 */
export const printSocialStatusPrerequisite = (
  prerequisite: SocialStatusPrerequisite,
): StdReader<PrerequisitePart | undefined, "t" | "tm" | "ibi", "SocialStatus"> =>
  prerequisite.display_option !== undefined
    ? printDisplayOption(prerequisite.display_option)
    : attributedNameR("prerequisite", "SocialStatus", prerequisite.id).thenW(name =>
        translateR("Social Status {$minStatus} or higher", {
          minStatus: name ?? MISSING_VALUE,
        }).map((value): PrerequisitePart | undefined => ({
          value,
          sentenceType: undefined,
          isMeta: false,
        })),
      )
