import { CulturePrerequisite } from "optolith-database-schema/gen"
import { type GetInstanceById } from "../../../../helpers/getTypes.js"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { printDisplayOption } from "../displayOption.js"
import { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a culture prerequisite.
 */
export const printCulturePrerequisite = (
  getInstanceById: GetInstanceById<"Culture">,
  locale: LocaleEnvironment,
  prerequisite: CulturePrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale, prerequisite.display_option)
  }

  const culture = getInstanceById("Culture", prerequisite.id)
  const cultureTranslation = locale.translateMap(culture?.translations)

  if (cultureTranslation === undefined) {
    return undefined
  }

  return {
    label: `${locale.translate("Culture")} `,
    value: cultureTranslation.name,
    sentenceType: undefined,
    isMeta: false,
  }
}
