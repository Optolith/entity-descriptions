import type { StdReader } from "../../../../env.js"
import { translateR } from "../../reader.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a culture prerequisite.
 */
export const printNoOtherAncestorBloodAdvantagePrerequisite: StdReader<
  PrerequisitePart | undefined,
  "t"
> = translateR("no other ancestor blood advantage").map(value => ({
  value,
  sentenceType: undefined,
  isMeta: false,
}))
