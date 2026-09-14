import type { AnySpecialAbilityOfGroupPrerequisite } from "@optolith/database-schema/gen"
import type { StdReader } from "../../../../env.js"
import { translateR } from "../../reader.js"
import { printDisplayOptionR } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a tiny activatable prerequisite.
 */
export const printAnySpecialAbilityOfGroupPrerequisite = (
  prerequisite: AnySpecialAbilityOfGroupPrerequisite,
): StdReader<PrerequisitePart | undefined, "t" | "tm"> => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOptionR(prerequisite.display_option)
  }

  return translateR(".input {$entity :string} {{a special ability}}", {
    entity: prerequisite.group.kind,
  }).map(name => ({
    value: name,
    sentenceType: undefined,
    isMeta: false,
  }))
}
