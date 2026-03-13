import type { CulturePrerequisite } from "optolith-database-schema/gen"
import type { GetInstanceById } from "../../../../helpers/getTypes.js"
import type { LocaleEnvironment } from "../../../../helpers/locale.js"
import { printDisplayOption } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a culture prerequisite.
 */
export const printCulturePrerequisite = (
  getInstanceById: GetInstanceById<"Culture">,
  locale: Pick<LocaleEnvironment, "translate" | "translateMap">,
  prerequisite: CulturePrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale.translateMap, prerequisite.display_option)
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
