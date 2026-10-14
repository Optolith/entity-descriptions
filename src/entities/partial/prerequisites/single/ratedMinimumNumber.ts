import { isNotNullish } from "@elyukai/utils/nullable"
import { Reader } from "@elyukai/utils/reader"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type {
  RatedMinimumNumberPrerequisite,
  RatedMinimumNumberPrerequisiteCombatTechniquesTarget,
  RatedMinimumNumberPrerequisiteCombatTechniquesTargetGroup,
  RatedMinimumNumberPrerequisiteForProfession,
  RatedMinimumNumberPrerequisiteLiturgiesTarget,
  RatedMinimumNumberPrerequisiteSkillsTarget,
  RatedMinimumNumberPrerequisiteSpellworksTarget,
  RatedMinimumNumberPrerequisiteSpellworksTargetForProfession,
  SpecialAbilityIdentifier,
} from "@optolith/database-schema/gen"
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

const printRatedMinimumNumberSkills = (
  prerequisite: { number: number; value: number },
  target: RatedMinimumNumberPrerequisiteSkillsTarget,
) =>
  Reader.traverse(target.targets, id => attributedNameR("prerequisite", "Skill", id))
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

const printRatedMinimumNumberCombatTechniques = (
  prerequisite: { number: number; value: number },
  target: RatedMinimumNumberPrerequisiteCombatTechniquesTarget,
) =>
  // de-DE: "Fernkampfwert 10"
  // en-US: "Ranged Combat 10"
  // nl-BE: "Schiet/werpwaarde 10"
  // fr-FR: "Ranged Combat 10"
  // it-IT: "Una tecnica di combattimento a distanza 10"
  printNumberOfCombatTechniques(target.group, prerequisite.number).map(count => ({
    value: `${count} ${prerequisite.value.toFixed()}`,
    sentenceType: undefined,
    isMeta: false,
  }))

const printRatedMinimumNumberSpellworks = (
  prerequisite: { number: number; value: number },
  target: RatedMinimumNumberPrerequisiteSpellworksTarget,
) =>
  attributedNameR("prerequisite", "Property", target.property)
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

const printRatedMinimumNumberSpellworksForProfession = (
  prerequisite: { number: number; value: number },
  target: RatedMinimumNumberPrerequisiteSpellworksTargetForProfession,
) => {
  switch (target.kind) {
    case "SelectOptions":
      return attributedNameR("prerequisite", target.SelectOptions)
        .map(name => name ?? MISSING_VALUE)
        .thenW(specialAbility =>
          translateR(
            ".input {$count :number} {{at least {$count} arcane works with properties for {$specialAbility}}}",
            {
              count: prerequisite.number,
              specialAbility,
            },
          ),
        )
        .map((value): PrerequisitePart | undefined => ({
          value,
          sentenceType: undefined,
          isMeta: false,
        }))
    case "Specific":
      return printRatedMinimumNumberSpellworks(prerequisite, { property: target.Specific })
    default:
      return assertExhaustive(target)
  }
}

const printRatedMinimumNumberLiturgies = (
  prerequisite: { number: number; value: number },
  target: RatedMinimumNumberPrerequisiteLiturgiesTarget,
) =>
  attributedNameR("prerequisite", "Aspect", target.aspect)
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
      return printRatedMinimumNumberSkills(prerequisite, prerequisite.targets.Skills)

    case "CombatTechniques":
      return printRatedMinimumNumberCombatTechniques(
        prerequisite,
        prerequisite.targets.CombatTechniques,
      )

    case "Spellworks":
      return printRatedMinimumNumberSpellworks(prerequisite, prerequisite.targets.Spellworks)

    case "Liturgies":
      return printRatedMinimumNumberLiturgies(prerequisite, prerequisite.targets.Liturgies)

    default:
      return assertExhaustive(prerequisite.targets)
  }
}

/**
 * Get the translation of a rated minimum number prerequisite.
 */
export const printRatedMinimumNumberPrerequisiteForProfession = (
  prerequisite: RatedMinimumNumberPrerequisiteForProfession,
): StdReader<
  PrerequisitePart | undefined,
  "t" | "tm" | "lc" | "lj" | "ibi",
  "Skill" | "Property" | "Aspect" | SpecialAbilityIdentifier["kind"]
> => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(prerequisite.display_option)
  }

  switch (prerequisite.targets.kind) {
    case "Skills":
      return printRatedMinimumNumberSkills(prerequisite, prerequisite.targets.Skills)

    case "CombatTechniques":
      return printRatedMinimumNumberCombatTechniques(
        prerequisite,
        prerequisite.targets.CombatTechniques,
      )

    case "Spellworks":
      return printRatedMinimumNumberSpellworksForProfession(
        prerequisite,
        prerequisite.targets.Spellworks,
      )

    case "Liturgies":
      return printRatedMinimumNumberLiturgies(prerequisite, prerequisite.targets.Liturgies)

    default:
      return assertExhaustive(prerequisite.targets)
  }
}
