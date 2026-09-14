import type { AnySpecialAbilityOfGroupPrerequisite } from "@optolith/database-schema/gen"
import type { StdReader } from "../../../../env.js"
import { translateR } from "../../reader.js"
import { printDisplayOption } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a tiny activatable prerequisite.
 */
export const printAnySpecialAbilityOfGroupPrerequisite = (
  prerequisite: AnySpecialAbilityOfGroupPrerequisite,
): StdReader<PrerequisitePart | undefined, "t" | "tm"> =>
  prerequisite.display_option !== undefined
    ? printDisplayOption(prerequisite.display_option)
    : translateR(".input {$entity :string} {{a special ability}}", {
        entity: prerequisite.group.kind,
      }).map(name => ({
        value: name,
        sentenceType: undefined,
        isMeta: false,
      }))
