import type { TinyActivatablePrerequisite } from "@optolith/database-schema/gen"
import type { StdReader } from "../../../../env.js"
import { attributedNameR } from "../../reader.js"
import { MISSING_VALUE } from "../../unknown.js"
import { printDisplayOption } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a tiny activatable prerequisite.
 */
export const printTinyActivatablePrerequisite = (
  prerequisite: TinyActivatablePrerequisite,
): StdReader<PrerequisitePart | undefined, "tm" | "ibi", "Blessing" | "Cantrip"> =>
  prerequisite.display_option !== undefined
    ? printDisplayOption(prerequisite.display_option)
    : attributedNameR("prerequisite", prerequisite.id).map(name => ({
        value: name ?? MISSING_VALUE,
        sentenceType: undefined,
        isMeta: false,
      }))
