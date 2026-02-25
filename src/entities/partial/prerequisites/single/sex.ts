import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type { BinarySex, SexPrerequisite } from "optolith-database-schema/gen"
import type { Translate } from "../../../../helpers/translate.js"
import { PrerequisitePart } from "../part.js"

const printId = (translate: Translate, id: BinarySex): string => {
  switch (id.kind) {
    case "Male":
      return translate("Male")
    case "Female":
      return translate("Female")
    default:
      return assertExhaustive(id)
  }
}

/**
 * Get the translation of a (binary) sex prerequisite.
 */
export const printBinarySexPrerequisite = (
  translate: Translate,
  prerequisite: SexPrerequisite,
): PrerequisitePart | undefined => ({
  value: printId(translate, prerequisite.id),
  sentenceType: undefined,
  isMeta: false,
})
