import type { StatePrerequisite } from "@optolith/database-schema/gen"
import type { GetInstanceById } from "../../../../helpers/getTypes.js"
import type { LocaleEnvironment } from "../../../../helpers/locale.js"
import { attributedNameFromSafeTranslation } from "../../markdown.js"
import { printDisplayOption } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a state prerequisite.
 */
export const printStatePrerequisite = (
  getInstanceById: GetInstanceById<"State">,
  locale: LocaleEnvironment,
  prerequisite: StatePrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale.translateMap, prerequisite.display_option)
  }

  const state = getInstanceById("State", prerequisite.id)
  const stateTranslation = locale.translateMap(state?.translations)

  if (stateTranslation === undefined) {
    return undefined
  }

  return {
    label: `${locale.translate("State")} `,
    value: attributedNameFromSafeTranslation(
      stateTranslation,
      "prerequisite",
      "State",
      prerequisite.id,
    ),
    sentenceType: undefined,
    isMeta: false,
  }
}
