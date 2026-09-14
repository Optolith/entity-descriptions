import type { StatePrerequisite } from "@optolith/database-schema/gen"
import type { StdReader } from "../../../../env.js"
import { attributedNameR, translateR } from "../../reader.js"
import { MISSING_VALUE } from "../../unknown.js"
import { printDisplayOption } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a state prerequisite.
 */
export const printStatePrerequisite = (
  prerequisite: StatePrerequisite,
): StdReader<PrerequisitePart | undefined, "t" | "tm" | "ibi", "State"> =>
  prerequisite.display_option !== undefined
    ? printDisplayOption(prerequisite.display_option)
    : attributedNameR("prerequisite", "State", prerequisite.id).thenW(name =>
        translateR("State").map((label): PrerequisitePart | undefined => ({
          label: `${label} `,
          value: name ?? MISSING_VALUE,
          sentenceType: undefined,
          isMeta: false,
        })),
      )
