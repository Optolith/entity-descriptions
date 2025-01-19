import { CulturePrerequisite } from "optolith-database-schema/types/prerequisites/single/CulturePrerequisite"
import { GetById } from "../../../../helpers/getTypes.js"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { printDisplayOption } from "../displayOption.js"
import { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a culture prerequisite.
 */
export const printCulturePrerequisite = (
  getCultureById: GetById.Static.Culture,
  locale: LocaleEnvironment,
  prerequisite: CulturePrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale, prerequisite.display_option)
  }

  const culture = getCultureById(prerequisite.id.culture)
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
