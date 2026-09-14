import type { RacePrerequisite } from "@optolith/database-schema/gen"
import type { StdReader } from "../../../../env.js"
import { attributedNameR, translateR } from "../../reader.js"
import { MISSING_VALUE } from "../../unknown.js"
import { printDisplayOption } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a race prerequisite.
 */
export const printRacePrerequisite = (
  prerequisite: RacePrerequisite,
): StdReader<PrerequisitePart | undefined, "t" | "tm" | "ibi", "Race"> =>
  prerequisite.display_option !== undefined
    ? printDisplayOption(prerequisite.display_option)
    : attributedNameR("prerequisite", "Race", prerequisite.id).thenW(name =>
        translateR("Race").map((label): PrerequisitePart | undefined => ({
          label: `${label} `,
          value: name ?? MISSING_VALUE,
          sentenceType: undefined,
          isMeta: false,
        })),
      )
