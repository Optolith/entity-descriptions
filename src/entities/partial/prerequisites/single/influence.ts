import type { InfluencePrerequisite } from "@optolith/database-schema/gen"
import type { StdReader } from "../../../../env.js"
import { attributedNameR, translateR } from "../../reader.js"
import { MISSING_VALUE } from "../../unknown.js"
import { printDisplayOption } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a culture prerequisite.
 */
export const printInfluencePrerequisite = (
  prerequisite: InfluencePrerequisite,
): StdReader<PrerequisitePart | undefined, "t" | "tm" | "ibi", "Influence"> =>
  prerequisite.display_option !== undefined
    ? printDisplayOption(prerequisite.display_option)
    : attributedNameR("prerequisite", "Influence", prerequisite.id).thenW(name =>
        translateR("no influence").map((label): PrerequisitePart | undefined => ({
          label: `${label} `,
          value: name ?? MISSING_VALUE,
          sentenceType: undefined,
          isMeta: false,
        })),
      )
