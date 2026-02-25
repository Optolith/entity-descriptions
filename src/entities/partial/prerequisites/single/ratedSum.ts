import { isNotNullish } from "@optolith/helpers/nullable"
import { RatedSumPrerequisite } from "optolith-database-schema/gen"
import { type GetInstanceById } from "../../../../helpers/getTypes.js"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { printDisplayOption } from "../displayOption.js"
import { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a rated sum prerequisite.
 */
export const printRatedSumPrerequisite = (
  getInstanceById: GetInstanceById<"Skill">,
  locale: LocaleEnvironment,
  prerequisite: RatedSumPrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale.translateMap, prerequisite.display_option)
  }

  const skills = prerequisite.targets
    .map(skillId => locale.translateMap(getInstanceById("Skill", skillId)?.translations)?.name)
    .filter(isNotNullish)

  return {
    value: locale.translate("the SR for {$skill} combined must add up to at least {$minRating}", {
      skill: locale.join(skills, "conjunction"),
      minRating: prerequisite.sum,
    }),
    sentenceType: undefined,
    isMeta: false,
  }
}
