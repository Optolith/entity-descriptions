import { isNotNullish } from "@optolith/helpers/nullable"
import { RatedSumPrerequisite } from "optolith-database-schema/types/prerequisites/single/RatedSumPrerequisite"
import { GetById } from "../../../../helpers/getTypes.js"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { printDisplayOption } from "../displayOption.js"
import { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a rated sum prerequisite.
 */
export const printRatedSumPrerequisite = (
  getSkillById: GetById.Static.Skill,
  locale: LocaleEnvironment,
  prerequisite: RatedSumPrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale, prerequisite.display_option)
  }

  const skills = prerequisite.targets
    .map(
      target =>
        locale.translateMap(getSkillById(target.skill)?.translations)?.name,
    )
    .filter(isNotNullish)

  return {
    value: locale.translate(
      "the SR for {0} combined must add up to at least {1}",
      locale.joinConjunctionList(skills),
      prerequisite.sum,
    ),
    sentenceType: undefined,
    isMeta: false,
  }
}
