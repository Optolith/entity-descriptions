import type {
  MagicalTraditionPrerequisite,
  MagicalTraditionPrerequisiteRestriction,
} from "@optolith/database-schema/gen"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type { LocaleEnvironment } from "../../../../helpers/locale.js"
import { printDisplayOption } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

const printValue = (
  locale: LocaleEnvironment,
  restriction: MagicalTraditionPrerequisiteRestriction | undefined,
) => {
  switch (restriction?.kind) {
    case "CanLearnRituals":
      return locale.translate("Tradition must be able to use rituals")
    case "CanBindFamiliars":
      return locale.translate("Tradition must be able to bind familiars")
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
    return printDisplayOption(locale.translateMap, prerequisite.display_option)
  }

  return {
    value: printValue(locale, prerequisite.restriction),
    sentenceType: undefined,
    isMeta: false,
  }
}
