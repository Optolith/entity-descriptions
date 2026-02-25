import { isNotNullish } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type {
  RatedMinimumNumberPrerequisite,
  RatedMinimumNumberPrerequisiteCombatTechniquesTargetGroup,
} from "optolith-database-schema/gen"
import { type GetInstanceById } from "../../../../helpers/getTypes.js"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { MISSING_VALUE } from "../../unknown.js"
import { printDisplayOption } from "../displayOption.js"
import { PrerequisitePart } from "../part.js"

const printNumberOfTheFollowingSkills = (locale: LocaleEnvironment, number: number): string =>
  locale.translate(".input {$count :number} {{{$count} of the following skills}}", {
    count: number,
  })

const printNumberOfAllCombatTechniques = (locale: LocaleEnvironment, number: number): string =>
  locale.translate(".input {$count :number} {{{$count} combat techniques}}", {
    count: number,
  })

const printNumberOfCloseCombatTechniques = (locale: LocaleEnvironment, number: number): string =>
  locale.translate(".input {$count :number} {{{$count} close combat techniques}}", {
    count: number,
  })

const printNumberOfRangedCombatTechniques = (locale: LocaleEnvironment, number: number): string =>
  locale.translate(".input {$count :number} {{{$count} ranged combat techniques}}", {
    count: number,
  })

const printNumberOfCombatTechniques = (
  locale: LocaleEnvironment,
  category: RatedMinimumNumberPrerequisiteCombatTechniquesTargetGroup,
  number: number,
): string => {
  switch (category.kind) {
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
  getInstanceById: GetInstanceById<"Skill" | "Property" | "Aspect">,
  locale: LocaleEnvironment,
  prerequisite: RatedMinimumNumberPrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale.translateMap, prerequisite.display_option)
  }

  switch (prerequisite.targets.kind) {
    case "Skills": {
      const skills = prerequisite.targets.Skills.targets
        .map(id => locale.translateMap(getInstanceById("Skill", id)?.translations)?.name)
        .filter(isNotNullish)

      return {
        value: locale.translate(
          ".input {$minRating :number} {{{$count} on at least SR {$minRating}: {$list}}}", // zwei der folgenden Talente mindestens FW 10:
          {
            count: printNumberOfTheFollowingSkills(locale, prerequisite.number),
            minRating: prerequisite.value,
            list: locale.join(skills, "conjunction"),
          },
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
          prerequisite.targets.CombatTechniques.group,
          prerequisite.number,
        )} ${prerequisite.value}`,
        sentenceType: undefined,
        isMeta: false,
      }
    }

    case "Spellworks": {
      return {
        value: locale.translate(
          ".input {$count :number} .input {$minRating :number} {{{$count} arcane works with the property {$property} at SR {$minRating} or higher}}",
          {
            count: prerequisite.number,
            property:
              locale.translateMap(
                getInstanceById("Property", prerequisite.targets.Spellworks.property)?.translations,
              )?.name ?? MISSING_VALUE,
            minRating: prerequisite.value,
          },
        ),
        sentenceType: undefined,
        isMeta: false,
      }
    }

    case "Liturgies": {
      return {
        value: locale.translate(
          ".input {$count :number} .input {$minRating :number} {{{$count} liturgical chants and ceremonies with the aspect {$aspect} at SR {$minRating} or higher}}",
          {
            count: prerequisite.number,
            aspect:
              locale.translateMap(
                getInstanceById("Aspect", prerequisite.targets.Liturgies.aspect)?.translations,
              )?.name ?? MISSING_VALUE,
            minRating: prerequisite.value,
          },
        ),
        sentenceType: undefined,
        isMeta: false,
      }
    }

    default:
      return assertExhaustive(prerequisite.targets)
  }
}
