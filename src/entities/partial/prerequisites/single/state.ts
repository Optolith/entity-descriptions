import { StatePrerequisite } from "optolith-database-schema/types/prerequisites/single/StatePrerequisite"
import { GetById } from "../../../../helpers/getTypes.js"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { printDisplayOption } from "../displayOption.js"
import { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a state prerequisite.
 */
export const printStatePrerequisite = (
  getStateById: GetById.Static.State,
  locale: LocaleEnvironment,
  prerequisite: StatePrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale, prerequisite.display_option)
  }

  const state = getStateById(prerequisite.id.state)
  const stateTranslation = locale.translateMap(state?.translations)

  if (stateTranslation === undefined) {
    return undefined
  }

  return {
    label: `${locale.translate("State")} `,
    value: `*${stateTranslation.name}*`,
    sentenceType: undefined,
    isMeta: false,
  }
}
