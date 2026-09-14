import { Reader } from "@elyukai/utils/reader"
import type {
  RatedMinimumNumberPrerequisite,
  RatedMinimumNumberPrerequisiteCombatTechniquesTargetGroup,
} from "@optolith/database-schema/gen"
import { isNotNullish } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type { StdReader } from "../../../../env.js"
import { attributedNameR, localeJoinR, localeSortR, translateR } from "../../reader.js"
import { MISSING_VALUE } from "../../unknown.js"
import { printDisplayOption } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

const printNumberOfTheFollowingSkills = (count: number) =>
  translateR(".input {$count :number} {{{$count} of the following skills}}", { count })

const printNumberOfAllCombatTechniques = (count: number) =>
  translateR(".input {$count :number} {{{$count} combat techniques}}", { count })

const printNumberOfCloseCombatTechniques = (count: number) =>
  translateR(".input {$count :number} {{{$count} close combat techniques}}", { count })

const printNumberOfRangedCombatTechniques = (count: number) =>
  translateR(".input {$count :number} {{{$count} ranged combat techniques}}", { count })

const printNumberOfCombatTechniques = (
  category: RatedMinimumNumberPrerequisiteCombatTechniquesTargetGroup,
  number: number,
) => {
  switch (category.kind) {
    case "All":
      return printNumberOfAllCombatTechniques(number)
    case "Close":
      return printNumberOfCloseCombatTechniques(number)
    case "Ranged":
      return printNumberOfRangedCombatTechniques(number)
    default:
      return assertExhaustive(category)
  }
}

/**
 * Get the translation of a rated minimum number prerequisite.
 */
export const printRatedMinimumNumberPrerequisite = (
  prerequisite: RatedMinimumNumberPrerequisite,
): StdReader<
  PrerequisitePart | undefined,
  "t" | "tm" | "lc" | "lj" | "ibi",
  "Skill" | "Property" | "Aspect"
> => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(prerequisite.display_option)
  }

  switch (prerequisite.targets.kind) {
    case "Skills":
      return Reader.traverse(prerequisite.targets.Skills.targets, id =>
        attributedNameR("prerequisite", "Skill", id),
      )
        .map(skills => skills.filter(isNotNullish))
        .thenW(localeSortR)
        .thenW(skills => localeJoinR(skills, "conjunction"))
        .thenW(list =>
          printNumberOfTheFollowingSkills(prerequisite.number)
            .then(count =>
              translateR(
                ".input {$minRating :number} {{{$count} on at least SR {$minRating}: {$list}}}", // zwei der folgenden Talente mindestens FW 10:
                {
                  count,
                  minRating: prerequisite.value,
                  list,
                },
              ),
            )
            .map(value => ({
              value,
              sentenceType: undefined,
              isMeta: false,
            })),
        )

    case "CombatTechniques":
      // de-DE: "Fernkampfwert 10"
      // en-US: "Ranged Combat 10"
      // nl-BE: "Schiet/werpwaarde 10"
      // fr-FR: "Ranged Combat 10"
      // it-IT: "Una tecnica di combattimento a distanza 10"

      return printNumberOfCombatTechniques(
        prerequisite.targets.CombatTechniques.group,
        prerequisite.number,
      ).map(count => ({
        value: `${count} ${prerequisite.value.toFixed()}`,
        sentenceType: undefined,
        isMeta: false,
      }))

    case "Spellworks":
      return attributedNameR("prerequisite", "Property", prerequisite.targets.Spellworks.property)
        .map(name => name ?? MISSING_VALUE)
        .thenW(property =>
          translateR(
            ".input {$count :number} .input {$minRating :number} {{{$count} arcane works with the property {$property} at SR {$minRating} or higher}}",
            {
              count: prerequisite.number,
              property,
              minRating: prerequisite.value,
            },
          ),
        )
        .map((value): PrerequisitePart | undefined => ({
          value,
          sentenceType: undefined,
          isMeta: false,
        }))

    case "Liturgies": {
      return attributedNameR("prerequisite", "Aspect", prerequisite.targets.Liturgies.aspect)
        .map(name => name ?? MISSING_VALUE)
        .thenW(aspect =>
          translateR(
            ".input {$count :number} .input {$minRating :number} {{{$count} liturgical chants and ceremonies with the aspect {$aspect} at SR {$minRating} or higher}}",
            {
              count: prerequisite.number,
              aspect,
              minRating: prerequisite.value,
            },
          ),
        )
        .map((value): PrerequisitePart | undefined => ({
          value,
          sentenceType: undefined,
          isMeta: false,
        }))
    }

    default:
      return assertExhaustive(prerequisite.targets)
  }
}
