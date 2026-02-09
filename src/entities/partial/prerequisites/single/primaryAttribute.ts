import { PrimaryAttributePrerequisite } from "optolith-database-schema/gen"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { printDisplayOption } from "../displayOption.js"
import { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a state prerequisite.
 */
export const printPrimaryAttributePrerequisite = (
  locale: LocaleEnvironment,
  prerequisite: PrimaryAttributePrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale, prerequisite.display_option)
  }

  return {
    label: `${locale.translate("Primary Attribute")} `,
    value: prerequisite.value.toString(),
    sentenceType: undefined,
    isMeta: false,
  }
}
