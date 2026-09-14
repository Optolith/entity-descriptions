import type {
  SexualCharacteristic,
  SexualCharacteristicPrerequisite,
} from "@optolith/database-schema/gen"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type { StdReader } from "../../../../env.js"
import { translateR } from "../../reader.js"
import type { PrerequisitePart } from "../part.js"

const printId = (id: SexualCharacteristic) => {
  switch (id.kind) {
    case "Penis":
      return translateR("Penis")
    case "Vagina":
      return translateR("Vagina")
    default:
      return assertExhaustive(id)
  }
}

/**
 * Get the translation of a sexual characteristic prerequisite.
 */
export const printSexualCharacteristicPrerequisite = (
  prerequisite: SexualCharacteristicPrerequisite,
): StdReader<PrerequisitePart | undefined, "t"> =>
  printId(prerequisite.id)
    .then(sexualCharacteristic =>
      translateR("Person with {$sexualCharacteristic}", {
        sexualCharacteristic,
      }),
    )
    .map(value => ({
      value,
      sentenceType: undefined,
      isMeta: false,
    }))
