import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type {
  SexualCharacteristic,
  SexualCharacteristicPrerequisite,
} from "optolith-database-schema/gen"
import type { LocaleEnvironment } from "../../../../helpers/locale.js"
import type { PrerequisitePart } from "../part.js"

const printId = (locale: LocaleEnvironment, id: SexualCharacteristic): string => {
  switch (id.kind) {
    case "Penis":
      return locale.translate("Penis")
    case "Vagina":
      return locale.translate("Vagina")
    default:
      return assertExhaustive(id)
  }
}

/**
 * Get the translation of a sexual characteristic prerequisite.
 */
export const printSexualCharacteristicPrerequisite = (
  locale: LocaleEnvironment,
  prerequisite: SexualCharacteristicPrerequisite,
): PrerequisitePart | undefined => ({
  value: locale.translate("Person with {$sexualCharacteristic}", {
    sexualCharacteristic: printId(locale, prerequisite.id),
  }),
  sentenceType: undefined,
  isMeta: false,
})
