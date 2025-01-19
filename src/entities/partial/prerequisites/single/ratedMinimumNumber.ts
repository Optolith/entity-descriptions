import { isNotNullish } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import {
  CombatTechniquesTargetGroup,
  RatedMinimumNumberPrerequisite,
} from "optolith-database-schema/types/prerequisites/single/RatedMinimumNumberPrerequisite"
import { GetById } from "../../../../helpers/getTypes.js"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { MISSING_VALUE } from "../../unknown.js"
import { printDisplayOption } from "../displayOption.js"
import { PrerequisitePart } from "../part.js"

const printNumberOfTheFollowingSkills = (
  locale: LocaleEnvironment,
  number: number,
): string => {
  switch (number) {
    case 1:
      return locale.translate("one of the following skills")
    case 2:
      return locale.translate("two of the following skills")
    case 3:
      return locale.translate("three of the following skills")
    case 4:
      return locale.translate("four of the following skills")
    case 5:
      return locale.translate("five of the following skills")
    case 6:
      return locale.translate("six of the following skills")
    case 7:
      return locale.translate("seven of the following skills")
    case 8:
      return locale.translate("eight of the following skills")
    case 9:
      return locale.translate("nine of the following skills")
    default:
      return locale.translate("{0} of the following skills")
  }
}

const printNumberOfAllCombatTechniques = (
  locale: LocaleEnvironment,
  number: number,
): string => {
  switch (number) {
    case 1:
      return locale.translate("one combat technique")
    case 2:
      return locale.translate("two combat techniques")
    case 3:
      return locale.translate("three combat techniques")
    case 4:
      return locale.translate("four combat techniques")
    case 5:
      return locale.translate("five combat techniques")
    case 6:
      return locale.translate("six combat techniques")
    case 7:
      return locale.translate("seven combat techniques")
    case 8:
      return locale.translate("eight combat techniques")
    case 9:
      return locale.translate("nine combat techniques")
    default:
      return locale.translate("{0} combat techniques")
  }
}

const printNumberOfCloseCombatTechniques = (
  locale: LocaleEnvironment,
  number: number,
): string => {
  switch (number) {
    case 1:
      return locale.translate("one close combat technique")
    case 2:
      return locale.translate("two close combat techniques")
    case 3:
      return locale.translate("three close combat techniques")
    case 4:
      return locale.translate("four close combat techniques")
    case 5:
      return locale.translate("five close combat techniques")
    case 6:
      return locale.translate("six close combat techniques")
    case 7:
      return locale.translate("seven close combat techniques")
    case 8:
      return locale.translate("eight close combat techniques")
    case 9:
      return locale.translate("nine close combat techniques")
    default:
      return locale.translate("{0} close combat techniques")
  }
}

const printNumberOfRangedCombatTechniques = (
  locale: LocaleEnvironment,
  number: number,
): string => {
  switch (number) {
    case 1:
      return locale.translate("one ranged combat technique")
    case 2:
      return locale.translate("two ranged combat techniques")
    case 3:
      return locale.translate("three ranged combat techniques")
    case 4:
      return locale.translate("four ranged combat techniques")
    case 5:
      return locale.translate("five ranged combat techniques")
    case 6:
      return locale.translate("six ranged combat techniques")
    case 7:
      return locale.translate("seven ranged combat techniques")
    case 8:
      return locale.translate("eight ranged combat techniques")
    case 9:
      return locale.translate("nine ranged combat techniques")
    default:
      return locale.translate("{0} ranged combat techniques")
  }
}

const printNumberOfCombatTechniques = (
  locale: LocaleEnvironment,
  category: CombatTechniquesTargetGroup,
  number: number,
): string => {
  switch (category) {
    case "All":
      return printNumberOfAllCombatTechniques(locale, number)
    case "Close":
      return printNumberOfCloseCombatTechniques(locale, number)
    case "Ranged":
      return printNumberOfRangedCombatTechniques(locale, number)
    default:
      return assertExhaustive(category)
  }
}

/**
 * Get the translation of a rated minimum number prerequisite.
 */
export const printRatedMinimumNumberPrerequisite = (
  getSkillById: GetById.Static.Skill,
  getPropertyById: GetById.Static.Property,
  getAspectById: GetById.Static.Aspect,
  locale: LocaleEnvironment,
  prerequisite: RatedMinimumNumberPrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale, prerequisite.display_option)
  }

  switch (prerequisite.targets.tag) {
    case "Skills": {
      const skills = prerequisite.targets.skills.list
        .map(
          ref =>
            locale.translateMap(getSkillById(ref.id.skill)?.translations)?.name,
        )
        .filter(isNotNullish)

      return {
        value: locale.translate(
          "{0} on at least SR {1}: {2}", // zwei der folgenden Talente mindestens FW 10:
          printNumberOfTheFollowingSkills(locale, prerequisite.number),
          prerequisite.value,
          locale.joinConjunctionList(skills),
        ),
        sentenceType: undefined,
        isMeta: false,
      }
    }

    case "CombatTechniques": {
      // de-DE: "Fernkampfwert 10"
      // en-US: "Ranged Combat 10"
      // nl-BE: "Schiet/werpwaarde 10"
      // fr-FR: "Ranged Combat 10"
      // it-IT: "Una tecnica di combattimento a distanza 10"

      return {
        value: `${printNumberOfCombatTechniques(
          locale,
          prerequisite.targets.combat_techniques.group,
          prerequisite.number,
        )} ${prerequisite.value}`,
        sentenceType: undefined,
        isMeta: false,
      }
    }

    case "Spellworks": {
      return {
        value: locale.translate(
          "{0} arcane works with the property {1} at SR {2} or higher",
          prerequisite.number,
          locale.translateMap(
            getPropertyById(prerequisite.targets.spellworks.id.property)
              ?.translations,
          )?.name ?? MISSING_VALUE,
          prerequisite.value,
        ),
        sentenceType: undefined,
        isMeta: false,
      }
    }

    case "Liturgies": {
      return {
        value: locale.translate(
          "{0} liturgical chants and ceremonies with the aspect {1} at SR {2} or higher",
          prerequisite.number,
          locale.translateMap(
            getAspectById(prerequisite.targets.liturgies.id.aspect)
              ?.translations,
          )?.name ?? MISSING_VALUE,
          prerequisite.value,
        ),
        sentenceType: undefined,
        isMeta: false,
      }
    }

    default:
      return assertExhaustive(prerequisite.targets)
  }
}
