import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type { BinarySex, SexPrerequisite } from "optolith-database-schema/gen"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { PrerequisitePart } from "../part.js"

const printId = (locale: LocaleEnvironment, id: BinarySex): string => {
  switch (id.kind) {
    case "Male":
      return locale.translate("Male")
    case "Female":
      return locale.translate("Female")
    default:
      return assertExhaustive(id)
  }
}

/**
 * Get the translation of a (binary) sex prerequisite.
 */
export const printBinarySexPrerequisite = (
  locale: LocaleEnvironment,
  prerequisite: SexPrerequisite,
): PrerequisitePart | undefined => ({
  value: printId(locale, prerequisite.id),
  sentenceType: undefined,
  isMeta: false,
})
