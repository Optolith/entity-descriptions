import { assertExhaustive } from "@optolith/helpers/typeSafety"
import {
  MagicalTraditionPrerequisite,
  MagicalTraditionPrerequisiteRestriction,
} from "optolith-database-schema/types/prerequisites/single/TraditionPrerequisite"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { printDisplayOption } from "../displayOption.js"
import { PrerequisitePart } from "../part.js"

const printValue = (
  locale: LocaleEnvironment,
  restriction: MagicalTraditionPrerequisiteRestriction | undefined,
) => {
  switch (restriction) {
    case "CanLearnRituals":
      return locale.translate(
        "Tradition must be able to use rituals",
        locale.translate("Church"),
      )
    case "CanBindFamiliars":
      return locale.translate(
        "Tradition must be able to bind familiars",
        locale.translate("Shaman"),
      )
    case undefined:
      return locale.translate("Tradition")
    default:
      return assertExhaustive(restriction)
  }
}

/**
 * Get the translation of a magical tradition prerequisite.
 */
export const printMagicalTraditionPrerequisite = (
  locale: LocaleEnvironment,
  prerequisite: MagicalTraditionPrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale, prerequisite.display_option)
  }

  return {
    value: printValue(locale, prerequisite.restriction),
    sentenceType: undefined,
    isMeta: false,
  }
}
