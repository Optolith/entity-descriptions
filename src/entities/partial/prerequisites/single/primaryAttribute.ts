import type { PrimaryAttributePrerequisite } from "@optolith/database-schema/gen"
import type { LocaleEnvironment } from "../../../../helpers/locale.js"
import { printDisplayOption } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a state prerequisite.
 */
export const printPrimaryAttributePrerequisite = (
  locale: LocaleEnvironment,
  prerequisite: PrimaryAttributePrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale.translateMap, prerequisite.display_option)
  }

  return {
    label: `${locale.translate("Primary Attribute")} `,
    value: prerequisite.value.toFixed(),
    sentenceType: undefined,
    isMeta: false,
  }
}
