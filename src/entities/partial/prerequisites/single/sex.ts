import type { BinarySex, SexPrerequisite } from "@optolith/database-schema/gen"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type { StdReader } from "../../../../env.js"
import { translateR } from "../../reader.js"
import type { PrerequisitePart } from "../part.js"

const printId = (id: BinarySex) => {
  switch (id.kind) {
    case "Male":
      return translateR("Male")
    case "Female":
      return translateR("Female")
    default:
      return assertExhaustive(id)
  }
}

/**
 * Get the translation of a (binary) sex prerequisite.
 */
export const printBinarySexPrerequisite = (
  prerequisite: SexPrerequisite,
): StdReader<PrerequisitePart | undefined, "t"> =>
  printId(prerequisite.id).map(value => ({
    value,
    sentenceType: undefined,
    isMeta: false,
  }))
