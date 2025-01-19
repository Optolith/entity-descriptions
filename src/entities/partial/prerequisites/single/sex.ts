import { assertExhaustive } from "@optolith/helpers/typeSafety"
import { BinarySex } from "optolith-database-schema/types/_Sex"
import { SexPrerequisite } from "optolith-database-schema/types/prerequisites/single/SexPrerequisite"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { PrerequisitePart } from "../part.js"

const printId = (locale: LocaleEnvironment, id: BinarySex): string => {
  switch (id) {
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
