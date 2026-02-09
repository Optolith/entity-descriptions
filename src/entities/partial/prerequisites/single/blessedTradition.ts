import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type {
  BlessedTraditionPrerequisite,
  BlessedTraditionPrerequisiteRestriction,
} from "optolith-database-schema/gen"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { printDisplayOption } from "../displayOption.js"
import { PrerequisitePart } from "../part.js"

const printValue = (
  locale: LocaleEnvironment,
  restriction: BlessedTraditionPrerequisiteRestriction | undefined,
) => {
  switch (restriction?.kind) {
    case "Church":
      return locale.translate("Tradition ({$tradition})", {
        tradition: locale.translate("Church"),
      })
    case "Shamanistic":
      return locale.translate("Tradition ({$tradition})", {
        tradition: locale.translate("Shaman"),
      })
    case undefined:
      return locale.translate("Tradition")
    default:
      return assertExhaustive(restriction)
  }
}

/**
 * Get the translation of a blessed tradition prerequisite.
 */
export const printBlessedTraditionPrerequisite = (
  locale: LocaleEnvironment,
  prerequisite: BlessedTraditionPrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale, prerequisite.display_option)
  }

  return {
    label: `${locale.translate("special ability")} `,
    value: printValue(locale, prerequisite.restriction),
    sentenceType: undefined,
    isMeta: false,
  }
}
