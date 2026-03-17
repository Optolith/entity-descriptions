import type { ProfessionPrerequisite } from "optolith-database-schema/gen"
import type { GetAllChildInstancesForParent } from "../../../../helpers/getTypes.js"
import type { LocaleEnvironment } from "../../../../helpers/locale.js"
import { attributedInstance } from "../../markdown.js"
import { getProfessionName } from "../../professions.js"
import { printDisplayOption } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

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
    value: attributedInstance(professionName, "Profession", prerequisite.id, {
      context: '"prerequisite"',
    }),
    sentenceType: undefined,
    isMeta: false,
  }
}
