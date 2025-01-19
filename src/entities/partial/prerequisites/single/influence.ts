import { InfluencePrerequisite } from "optolith-database-schema/types/prerequisites/single/InfluencePrerequisite"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { MISSING_VALUE } from "../../unknown.js"
import { printDisplayOption } from "../displayOption.js"
import { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a culture prerequisite.
 */
export const printInfluencePrerequisite = (
  locale: LocaleEnvironment,
  prerequisite: InfluencePrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale, prerequisite.display_option)
  }

  // TODO

  return {
    value: MISSING_VALUE,
    sentenceType: undefined,
    isMeta: false,
  }
}
