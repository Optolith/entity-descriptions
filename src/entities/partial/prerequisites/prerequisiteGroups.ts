import type {
  ActivatableIdentifier,
  AdvantageDisadvantagePrerequisiteGroup,
  AnimistPowerPrerequisiteGroup,
  ArcaneTraditionPrerequisiteGroup,
  DerivedCharacteristicPrerequisiteGroup,
  EnhancementPrerequisiteGroup,
  GeneralPrerequisiteGroup,
  GeodeRitualPrerequisiteGroup,
  InfluencePrerequisiteGroup,
  LanguagePrerequisiteGroup,
  LiturgyPrerequisiteGroup,
  PersonalityTraitPrerequisiteGroup,
  PreconditionGroup,
  ProfessionPrerequisiteGroup,
  PublicationPrerequisiteGroup,
  RatedIdentifier,
  SpellworkPrerequisiteGroup,
} from "@optolith/database-schema/gen"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type { StdReader } from "../../../env.js"
import type { PrerequisitePart } from "./part.js"
import { printActivatablePrerequisite } from "./single/activatable.js"
import { printAnimistPowerPrerequisite } from "./single/animistPower.js"
import { printAnySpecialAbilityOfGroupPrerequisite } from "./single/anySpecialAbilityOfGroup.js"
import { printBlessedTraditionPrerequisite } from "./single/blessedTradition.js"
import { printCommonSuggestedByRCPPrerequisite } from "./single/commonSuggestedByRCP.js"
import { printCulturePrerequisite } from "./single/culture.js"
import { printEnhancementPrerequisite } from "./single/enhancement.js"
import { printInfluencePrerequisite } from "./single/influence.js"
import { printMagicalTraditionPrerequisite } from "./single/magicalTradition.js"
import { printNoOtherAncestorBloodAdvantagePrerequisite } from "./single/noOtherAncestorBloodAdvantage.js"
import { printPactPrerequisite } from "./single/pact.js"
import { printPersonalityTraitPrerequisite } from "./single/personalityTrait.js"
import { printPrimaryAttributePrerequisite } from "./single/primaryAttribute.js"
import { printProfessionPrerequisite } from "./single/profession.js"
import { printPublicationPrerequisite } from "./single/publication.js"
import { printRacePrerequisite } from "./single/race.js"
import { printRatedPrerequisite } from "./single/rated.js"
import { printRatedMinimumNumberPrerequisite } from "./single/ratedMinimumNumber.js"
import { printRatedSumPrerequisite } from "./single/ratedSum.js"
import { printRulePrerequisite } from "./single/rule.js"
import { printBinarySexPrerequisite } from "./single/sex.js"
import { printSexualCharacteristicPrerequisite } from "./single/sexualCharacteristic.js"
import { printSocialStatusPrerequisite } from "./single/socialStatus.js"
import { printStatePrerequisite } from "./single/state.js"
import { printTextPrerequisite } from "./single/text.js"
import { printTinyActivatablePrerequisite } from "./single/tinyActivatable.js"

/**
 * Print the translation of a derived characteristic prerequisite group.
 */
export const printDerivedCharacteristicPrerequisiteGroup = (
  prerequisite: DerivedCharacteristicPrerequisiteGroup,
): StdReader<PrerequisitePart | undefined, "t" | "tm"> => {
  switch (prerequisite.kind) {
    case "Rule":
      return printRulePrerequisite(prerequisite.Rule)
    case "BlessedTradition":
      return printBlessedTraditionPrerequisite(prerequisite.BlessedTradition)
    case "MagicalTradition":
      return printMagicalTraditionPrerequisite(prerequisite.MagicalTradition)
    default:
      return assertExhaustive(prerequisite)
  }
}

/**
 * Print the translation of a publication prerequisite group.
 */
export const printPublicationPrerequisiteGroup = (
  prerequisite: PublicationPrerequisiteGroup,
): StdReader<PrerequisitePart | undefined, "t" | "tm" | "ibi", "Publication"> =>
  // switch (prerequisite.tag) {
  //   case "Publication":
  //   default:
  //     return assertExhaustive(prerequisite)
  // }
  printPublicationPrerequisite(prerequisite.Publication)

/**
 * Print the translation of a general prerequisite group.
 */
export const printGeneralPrerequisiteGroup = (
  prerequisite: GeneralPrerequisiteGroup,
): StdReader<
  PrerequisitePart | undefined,
  "t" | "tm" | "lj" | "lc" | "rso" | "ibi",
  | "Race"
  | "Culture"
  | "PactCategory"
  | "PactDomain"
  | "SocialStatus"
  | "State"
  | ActivatableIdentifier["kind"]
  | RatedIdentifier["kind"]
  | "Property"
  | "Aspect"
  | "Enhancement"
  | "PersonalityTrait"
  | "Blessing"
  | "Cantrip"
> => {
  switch (prerequisite.kind) {
    case "Sex":
      return printBinarySexPrerequisite(prerequisite.Sex)
    case "Race":
      return printRacePrerequisite(prerequisite.Race)
    case "Culture":
      return printCulturePrerequisite(prerequisite.Culture)
    case "Pact":
      return printPactPrerequisite(prerequisite.Pact)
    case "SocialStatus":
      return printSocialStatusPrerequisite(prerequisite.SocialStatus)
    case "State":
      return printStatePrerequisite(prerequisite.State)
    case "Rule":
      return printRulePrerequisite(prerequisite.Rule)
    case "PrimaryAttribute":
      return printPrimaryAttributePrerequisite(prerequisite.PrimaryAttribute)
    case "Activatable":
      return printActivatablePrerequisite(prerequisite.Activatable).with(env => ({
        ...env,
        displayedInProfession: false,
      }))
    case "BlessedTradition":
      return printBlessedTraditionPrerequisite(prerequisite.BlessedTradition)
    case "MagicalTradition":
      return printMagicalTraditionPrerequisite(prerequisite.MagicalTradition)
    case "TinyActivatable":
      return printTinyActivatablePrerequisite(prerequisite.TinyActivatable)
    case "AnySpecialAbilityOfGroup":
      return printAnySpecialAbilityOfGroupPrerequisite(prerequisite.AnySpecialAbilityOfGroup)
    case "Rated":
      return printRatedPrerequisite(prerequisite.Rated)
    case "RatedMinimumNumber":
      return printRatedMinimumNumberPrerequisite(prerequisite.RatedMinimumNumber)
    case "RatedSum":
      return printRatedSumPrerequisite(prerequisite.RatedSum)
    case "Enhancement":
      return printEnhancementPrerequisite(prerequisite.Enhancement)
    case "Text":
      return printTextPrerequisite(prerequisite.Text)
    case "SexualCharacteristic":
      return printSexualCharacteristicPrerequisite(prerequisite.SexualCharacteristic)
    case "PersonalityTrait":
      return printPersonalityTraitPrerequisite(prerequisite.PersonalityTrait)
    default:
      return assertExhaustive(prerequisite)
  }
}

/**
 * Print the translation of a profession prerequisite group.
 */
export const printProfessionPrerequisiteGroup = (
  prerequisite: ProfessionPrerequisiteGroup,
): StdReader<
  PrerequisitePart | undefined,
  "t" | "tm" | "rso" | "ibi",
  "Race" | "Culture" | ActivatableIdentifier["kind"] | RatedIdentifier["kind"] | "Aspect"
> => {
  switch (prerequisite.kind) {
    case "Sex":
      return printBinarySexPrerequisite(prerequisite.Sex)
    case "Race":
      return printRacePrerequisite(prerequisite.Race)
    case "Culture":
      return printCulturePrerequisite(prerequisite.Culture)
    case "Activatable":
      return printActivatablePrerequisite(prerequisite.Activatable).with(env => ({
        ...env,
        displayedInProfession: true,
      }))
    case "Rated":
      return printRatedPrerequisite(prerequisite.Rated)
    default:
      return assertExhaustive(prerequisite)
  }
}

/**
 * Print the translation of an advantage/disadvantage prerequisite group.
 */
export const printAdvantageDisadvantagePrerequisiteGroup = (
  prerequisite: AdvantageDisadvantagePrerequisiteGroup,
  name: string,
  type: "Advantage" | "Disadvantage",
): StdReader<
  PrerequisitePart | undefined,
  "t" | "tm" | "lj" | "lc" | "rso" | "ibi",
  | "Race"
  | "Culture"
  | "PactCategory"
  | "PactDomain"
  | "SocialStatus"
  | "State"
  | ActivatableIdentifier["kind"]
  | RatedIdentifier["kind"]
  | "Property"
  | "Aspect"
  | "Enhancement"
  | "PersonalityTrait"
  | "Blessing"
  | "Cantrip"
> => {
  switch (prerequisite.kind) {
    case "CommonSuggestedByRCP":
      return printCommonSuggestedByRCPPrerequisite(name, type)
    case "NoOtherAncestorBloodAdvantage":
      return printNoOtherAncestorBloodAdvantagePrerequisite
    case "Sex":
    case "Race":
    case "Culture":
    case "Pact":
    case "SocialStatus":
    case "State":
    case "Rule":
    case "PrimaryAttribute":
    case "Activatable":
    case "BlessedTradition":
    case "MagicalTradition":
    case "AnySpecialAbilityOfGroup":
    case "TinyActivatable":
    case "Rated":
    case "RatedMinimumNumber":
    case "RatedSum":
    case "Enhancement":
    case "Text":
    case "SexualCharacteristic":
    case "PersonalityTrait":
      return printGeneralPrerequisiteGroup(prerequisite)
    default:
      return assertExhaustive(prerequisite)
  }
}

/**
 * Print the translation of an arcane tradition prerequisite group.
 */
export const printArcaneTraditionPrerequisiteGroup = (
  prerequisite: ArcaneTraditionPrerequisiteGroup,
): StdReader<PrerequisitePart | undefined, "t" | "tm" | "ibi", "Culture"> => {
  switch (prerequisite.kind) {
    case "Sex":
      return printBinarySexPrerequisite(prerequisite.Sex)
    case "Culture":
      return printCulturePrerequisite(prerequisite.Culture)
    default:
      return assertExhaustive(prerequisite)
  }
}

/**
 * Print the translation of a personality trait prerequisite group.
 */
export const printPersonalityTraitPrerequisiteGroup = (
  prerequisite: PersonalityTraitPrerequisiteGroup,
): StdReader<
  PrerequisitePart | undefined,
  "t" | "tm" | "ibi",
  "Race" | "Culture" | "PersonalityTrait"
> => {
  switch (prerequisite.kind) {
    case "Race":
      return printRacePrerequisite(prerequisite.Race)
    case "Culture":
      return printCulturePrerequisite(prerequisite.Culture)
    case "PersonalityTrait":
      return printPersonalityTraitPrerequisite(prerequisite.PersonalityTrait)
    case "Text":
      return printTextPrerequisite(prerequisite.Text)
    default:
      return assertExhaustive(prerequisite)
  }
}

/**
 * Print the translation of a spellwork prerequisite group.
 */
export const printSpellworkPrerequisiteGroup = (
  prerequisite: SpellworkPrerequisiteGroup,
): StdReader<PrerequisitePart | undefined, "t" | "tm" | "ibi", RatedIdentifier["kind"]> => {
  switch (prerequisite.kind) {
    case "Rule":
      return printRulePrerequisite(prerequisite.Rule)
    case "Rated":
      return printRatedPrerequisite(prerequisite.Rated)
    default:
      return assertExhaustive(prerequisite)
  }
}

/**
 * Print the translation of a liturgy prerequisite group.
 */
export const printLiturgyPrerequisiteGroup = (
  prerequisite: LiturgyPrerequisiteGroup,
): StdReader<PrerequisitePart | undefined, never> =>
  // switch (prerequisite.tag) {
  //   case "Rule":
  //   default:
  //     return assertExhaustive(prerequisite)
  // }
  printRulePrerequisite(prerequisite.Rule)

/**
 * Print the translation of an influence prerequisite group.
 */
export const printInfluencePrerequisiteGroup = (
  prerequisite: InfluencePrerequisiteGroup,
): StdReader<
  PrerequisitePart | undefined,
  "t" | "tm" | "rso" | "ibi" | "acibp",
  "Influence" | "Race" | ActivatableIdentifier["kind"] | "Aspect",
  never,
  "ProfessionVersion"
> => {
  switch (prerequisite.kind) {
    case "Influence":
      return printInfluencePrerequisite(prerequisite.Influence)
    case "Race":
      return printRacePrerequisite(prerequisite.Race)
    case "Profession":
      return printProfessionPrerequisite(prerequisite.Profession)
    case "Activatable":
      return printActivatablePrerequisite(prerequisite.Activatable).with(env => ({
        ...env,
        displayedInProfession: false,
      }))
    case "Text":
      return printTextPrerequisite(prerequisite.Text)
    default:
      return assertExhaustive(prerequisite)
  }
}

/**
 * Print the translation of a language prerequisite group.
 */
export const printLanguagePrerequisiteGroup = (
  prerequisite: LanguagePrerequisiteGroup,
): StdReader<
  PrerequisitePart | undefined,
  "t" | "tm" | "rso" | "ibi",
  "Race" | ActivatableIdentifier["kind"] | "Aspect"
> => {
  switch (prerequisite.kind) {
    case "Race":
      return printRacePrerequisite(prerequisite.Race)
    case "Activatable":
      return printActivatablePrerequisite(prerequisite.Activatable).with(env => ({
        ...env,
        displayedInProfession: false,
      }))
    case "Text":
      return printTextPrerequisite(prerequisite.Text)
    default:
      return assertExhaustive(prerequisite)
  }
}

/**
 * Print the translation of an animist power prerequisite group.
 */
export const printAnimistPowerPrerequisiteGroup = (
  prerequisite: AnimistPowerPrerequisiteGroup,
): StdReader<PrerequisitePart | undefined, "tm" | "ibi", "AnimistPower"> =>
  // switch (prerequisite.tag) {
  //   case "AnimistPower":
  //   default:
  //     return assertExhaustive(prerequisite)
  // }
  printAnimistPowerPrerequisite(prerequisite.AnimistPower)

/**
 * Print the translation of a geode ritual prerequisite group.
 */
export const printGeodeRitualPrerequisiteGroup = (
  prerequisite: GeodeRitualPrerequisiteGroup,
): StdReader<
  PrerequisitePart | undefined,
  "t" | "tm" | "rso" | "ibi",
  ActivatableIdentifier["kind"] | "Aspect" | "Influence"
> => {
  switch (prerequisite.kind) {
    case "Activatable":
      return printActivatablePrerequisite(prerequisite.Activatable).with(env => ({
        ...env,
        displayedInProfession: false,
      }))
    case "Influence":
      return printInfluencePrerequisite(prerequisite.Influence)
    default:
      return assertExhaustive(prerequisite)
  }
}

/**
 * Print the translation of an enhancement prerequisite group.
 */
export const printEnhancementPrerequisiteGroup = (
  prerequisite: EnhancementPrerequisiteGroup,
): StdReader<
  PrerequisitePart | undefined,
  "t" | "tm" | "ibi",
  RatedIdentifier["kind"] | "Enhancement"
> => {
  switch (prerequisite.kind) {
    case "Rated":
      return printRatedPrerequisite(prerequisite.Rated)
    case "Enhancement":
      return printEnhancementPrerequisite(prerequisite.Enhancement).with(env => ({
        ...env,
        hideParent: true,
      }))
    default:
      return assertExhaustive(prerequisite)
  }
}

/**
 * Print the translation of a precondition group.
 */
export const printPreconditionGroup = (
  prerequisite: PreconditionGroup,
): StdReader<PrerequisitePart | undefined, "t" | "tm" | "ibi", "Publication"> => {
  switch (prerequisite.kind) {
    case "Publication":
      return printPublicationPrerequisite(prerequisite.Publication)
    case "Rule":
      return printRulePrerequisite(prerequisite.Rule)
    case "SexualCharacteristic":
      return printSexualCharacteristicPrerequisite(prerequisite.SexualCharacteristic)
    default:
      return assertExhaustive(prerequisite)
  }
}
