import { type ProfessionPrerequisite } from "optolith-database-schema/gen"
import { type GetAllChildInstancesForParent } from "../../../../helpers/getTypes.js"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { getProfessionName } from "../../professions.js"
import { printDisplayOption } from "../displayOption.js"
import { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a profession prerequisite.
 */
export const printProfessionPrerequisite = (
  getChildInstancesForInstanceId: GetAllChildInstancesForParent<"ProfessionVersion">,
  locale: Pick<LocaleEnvironment, "translateMap">,
  prerequisite: ProfessionPrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.displayOption !== undefined) {
    return printDisplayOption(locale.translateMap, prerequisite.displayOption)
  }

  const professionName = getProfessionName(
    locale.translateMap,
    getChildInstancesForInstanceId,
    prerequisite.id,
  )

  if (professionName === undefined) {
    return undefined
  }

  return {
    value: professionName,
    sentenceType: undefined,
    isMeta: false,
  }
}
