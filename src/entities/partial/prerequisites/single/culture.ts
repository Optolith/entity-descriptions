import type { CulturePrerequisite } from "@optolith/database-schema/gen"
import type { StdReader } from "../../../../env.js"
import { attributedNameR, translateR } from "../../reader.js"
import { MISSING_VALUE } from "../../unknown.js"
import { printDisplayOption } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a culture prerequisite.
 */
export const printCulturePrerequisite = (
  prerequisite: CulturePrerequisite,
): StdReader<PrerequisitePart | undefined, "t" | "tm" | "ibi", "Culture"> =>
  prerequisite.display_option !== undefined
    ? printDisplayOption(prerequisite.display_option)
    : attributedNameR("prerequisite", "Culture", prerequisite.id).thenW(name =>
        translateR("Culture").map((label): PrerequisitePart | undefined => ({
          label: `${label} `,
          value: name ?? MISSING_VALUE,
          sentenceType: undefined,
          isMeta: false,
        })),
      )
