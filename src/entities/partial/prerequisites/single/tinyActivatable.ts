import type { TinyActivatablePrerequisite } from "@optolith/database-schema/gen"
import type { StdReader } from "../../../../env.js"
import { attributedCustomNameR } from "../../reader.js"
import { MISSING_VALUE } from "../../unknown.js"
import { printDisplayOptionR } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a tiny activatable prerequisite.
 */
export const printTinyActivatablePrerequisite = (
  prerequisite: TinyActivatablePrerequisite,
): StdReader<PrerequisitePart | undefined, "tm" | "ibi", "Blessing" | "Cantrip"> => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOptionR(prerequisite.display_option)
  }

  return attributedCustomNameR(
    "prerequisite",
    (t: { name: string; abbreviation?: string }) => t.abbreviation ?? t.name,
    prerequisite.id,
  ).map(name => ({
    value: name ?? MISSING_VALUE,
    sentenceType: undefined,
    isMeta: false,
  }))
}
