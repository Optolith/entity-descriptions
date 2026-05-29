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
import type { GetAllChildInstancesForParent, GetInstanceById } from "../../../helpers/getTypes.js"
import type { LocaleEnvironment } from "../../../helpers/locale.js"
import type { PrerequisitePart } from "./part.js"
import {
  type GetResolvedSelectOptionById,
  printActivatablePrerequisite,
} from "./single/activatable.js"
import { printAnimistPowerPrerequisite } from "./single/animistPower.js"
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

/**
 * Print the translation of a derived characteristic prerequisite group.
 */
export const printDerivedCharacteristicPrerequisiteGroup = (
  locale: LocaleEnvironment,
  prerequisite: DerivedCharacteristicPrerequisiteGroup,
): PrerequisitePart | undefined => {
  switch (prerequisite.kind) {
    case "Rule":
      return printRulePrerequisite(locale, prerequisite.Rule)
    case "BlessedTradition":
      return printBlessedTraditionPrerequisite(locale, prerequisite.BlessedTradition)
    case "MagicalTradition":
      return printMagicalTraditionPrerequisite(locale, prerequisite.MagicalTradition)
    default:
      return assertExhaustive(prerequisite)
  }
}

/**
 * Print the translation of a publication prerequisite group.
 */
export const printPublicationPrerequisiteGroup = (
  getInstanceById: GetInstanceById<"Publication">,
  locale: LocaleEnvironment,
  prerequisite: PublicationPrerequisiteGroup,
): PrerequisitePart | undefined =>
  // switch (prerequisite.tag) {
  //   case "Publication":
  //   default:
  //     return assertExhaustive(prerequisite)
  // }
  printPublicationPrerequisite(getInstanceById, locale, prerequisite.Publication)

/**
 * Print the translation of a general prerequisite group.
 */
export const printGeneralPrerequisiteGroup = (
  getInstanceById: GetInstanceById<
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
  >,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  locale: LocaleEnvironment,
  prerequisite: GeneralPrerequisiteGroup,
): PrerequisitePart | undefined => {
  switch (prerequisite.kind) {
    case "Sex":
      return printBinarySexPrerequisite(locale.translate, prerequisite.Sex)
    case "Race":
      return printRacePrerequisite(getInstanceById, locale, prerequisite.Race)
    case "Culture":
      return printCulturePrerequisite(getInstanceById, locale, prerequisite.Culture)
    case "Pact":
      return printPactPrerequisite(getInstanceById, locale, prerequisite.Pact)
    case "SocialStatus":
      return printSocialStatusPrerequisite(getInstanceById, locale, prerequisite.SocialStatus)
    case "State":
      return printStatePrerequisite(getInstanceById, locale, prerequisite.State)
    case "Rule":
      return printRulePrerequisite(locale, prerequisite.Rule)
    case "PrimaryAttribute":
      return printPrimaryAttributePrerequisite(locale, prerequisite.PrimaryAttribute)
    case "Activatable":
      return printActivatablePrerequisite(
        getInstanceById,
        getResolvedSelectOptionById,
        locale,
        prerequisite.Activatable,
        false,
      )
    case "BlessedTradition":
      return printBlessedTraditionPrerequisite(locale, prerequisite.BlessedTradition)
    case "MagicalTradition":
      return printMagicalTraditionPrerequisite(locale, prerequisite.MagicalTradition)
    case "Rated":
      return printRatedPrerequisite(getInstanceById, locale, prerequisite.Rated)
    case "RatedMinimumNumber":
      return printRatedMinimumNumberPrerequisite(
        getInstanceById,
        locale,
        prerequisite.RatedMinimumNumber,
      )
    case "RatedSum":
      return printRatedSumPrerequisite(getInstanceById, locale, prerequisite.RatedSum)
    case "Enhancement":
      return printEnhancementPrerequisite(getInstanceById, locale, prerequisite.Enhancement)
    case "Text":
      return printTextPrerequisite(locale, prerequisite.Text)
    case "SexualCharacteristic":
      return printSexualCharacteristicPrerequisite(locale, prerequisite.SexualCharacteristic)
    default:
      return assertExhaustive(prerequisite)
  }
}

/**
 * Print the translation of a profession prerequisite group.
 */
export const printProfessionPrerequisiteGroup = (
  getInstanceById: GetInstanceById<
    "Race" | "Culture" | ActivatableIdentifier["kind"] | RatedIdentifier["kind"] | "Aspect"
  >,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  locale: Pick<LocaleEnvironment, "translate" | "translateMap">,
  prerequisite: ProfessionPrerequisiteGroup,
): PrerequisitePart | undefined => {
  switch (prerequisite.kind) {
    case "Sex":
      return printBinarySexPrerequisite(locale.translate, prerequisite.Sex)
    case "Race":
      return printRacePrerequisite(getInstanceById, locale, prerequisite.Race)
    case "Culture":
      return printCulturePrerequisite(getInstanceById, locale, prerequisite.Culture)
    case "Activatable":
      return printActivatablePrerequisite(
        getInstanceById,
        getResolvedSelectOptionById,
        locale,
        prerequisite.Activatable,
        true,
      )
    case "Rated":
      return printRatedPrerequisite(getInstanceById, locale, prerequisite.Rated)
    default:
      return assertExhaustive(prerequisite)
  }
}

/**
 * Print the translation of an advantage/disadvantage prerequisite group.
 */
export const printAdvantageDisadvantagePrerequisiteGroup = (
  getInstanceById: GetInstanceById<
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
  >,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  locale: LocaleEnvironment,
  prerequisite: AdvantageDisadvantagePrerequisiteGroup,
  name: string,
  type: "Advantage" | "Disadvantage",
): PrerequisitePart | undefined => {
  switch (prerequisite.kind) {
    case "CommonSuggestedByRCP":
      return printCommonSuggestedByRCPPrerequisite(locale, name, type)
    case "NoOtherAncestorBloodAdvantage":
      return printNoOtherAncestorBloodAdvantagePrerequisite(locale)
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
    case "Rated":
    case "RatedMinimumNumber":
    case "RatedSum":
    case "Enhancement":
    case "Text":
    case "SexualCharacteristic":
      return printGeneralPrerequisiteGroup(
        getInstanceById,
        getResolvedSelectOptionById,
        locale,
        prerequisite,
      )
    default:
      return assertExhaustive(prerequisite)
  }
}

/**
 * Print the translation of an arcane tradition prerequisite group.
 */
export const printArcaneTraditionPrerequisiteGroup = (
  getInstanceById: GetInstanceById<"Culture">,
  locale: LocaleEnvironment,
  prerequisite: ArcaneTraditionPrerequisiteGroup,
): PrerequisitePart | undefined => {
  switch (prerequisite.kind) {
    case "Sex":
      return printBinarySexPrerequisite(locale.translate, prerequisite.Sex)
    case "Culture":
      return printCulturePrerequisite(getInstanceById, locale, prerequisite.Culture)
    default:
      return assertExhaustive(prerequisite)
  }
}

/**
 * Print the translation of a personality trait prerequisite group.
 */
export const printPersonalityTraitPrerequisiteGroup = (
  getInstanceById: GetInstanceById<"Race" | "Culture" | "PersonalityTrait">,
  locale: LocaleEnvironment,
  prerequisite: PersonalityTraitPrerequisiteGroup,
): PrerequisitePart | undefined => {
  switch (prerequisite.kind) {
    case "Race":
      return printRacePrerequisite(getInstanceById, locale, prerequisite.Race)
    case "Culture":
      return printCulturePrerequisite(getInstanceById, locale, prerequisite.Culture)
    case "PersonalityTrait":
      return printPersonalityTraitPrerequisite(
        getInstanceById,
        locale,
        prerequisite.PersonalityTrait,
      )
    case "Text":
      return printTextPrerequisite(locale, prerequisite.Text)
    default:
      return assertExhaustive(prerequisite)
  }
}

/**
 * Print the translation of a spellwork prerequisite group.
 */
export const printSpellworkPrerequisiteGroup = (
  getInstanceById: GetInstanceById<RatedIdentifier["kind"]>,
  locale: LocaleEnvironment,
  prerequisite: SpellworkPrerequisiteGroup,
): PrerequisitePart | undefined => {
  switch (prerequisite.kind) {
    case "Rule":
      return printRulePrerequisite(locale, prerequisite.Rule)
    case "Rated":
      return printRatedPrerequisite(getInstanceById, locale, prerequisite.Rated)
    default:
      return assertExhaustive(prerequisite)
  }
}

/**
 * Print the translation of a liturgy prerequisite group.
 */
export const printLiturgyPrerequisiteGroup = (
  locale: LocaleEnvironment,
  prerequisite: LiturgyPrerequisiteGroup,
): PrerequisitePart | undefined =>
  // switch (prerequisite.tag) {
  //   case "Rule":
  //   default:
  //     return assertExhaustive(prerequisite)
  // }
  printRulePrerequisite(locale, prerequisite.Rule)

/**
 * Print the translation of an influence prerequisite group.
 */
export const printInfluencePrerequisiteGroup = (
  getInstanceById: GetInstanceById<"Influence" | "Race" | ActivatableIdentifier["kind"] | "Aspect">,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  getChildInstancesForInstanceId: GetAllChildInstancesForParent<"ProfessionVersion">,
  locale: LocaleEnvironment,
  prerequisite: InfluencePrerequisiteGroup,
): PrerequisitePart | undefined => {
  switch (prerequisite.kind) {
    case "Influence":
      return printInfluencePrerequisite(getInstanceById, locale, prerequisite.Influence)
    case "Race":
      return printRacePrerequisite(getInstanceById, locale, prerequisite.Race)
    case "Profession":
      return printProfessionPrerequisite(
        getChildInstancesForInstanceId,
        locale,
        prerequisite.Profession,
      )
    case "Activatable":
      return printActivatablePrerequisite(
        getInstanceById,
        getResolvedSelectOptionById,
        locale,
        prerequisite.Activatable,
        false,
      )
    case "Text":
      return printTextPrerequisite(locale, prerequisite.Text)
    default:
      return assertExhaustive(prerequisite)
  }
}

/**
 * Print the translation of a language prerequisite group.
 */
export const printLanguagePrerequisiteGroup = (
  getInstanceById: GetInstanceById<"Race" | ActivatableIdentifier["kind"] | "Aspect">,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  locale: LocaleEnvironment,
  prerequisite: LanguagePrerequisiteGroup,
): PrerequisitePart | undefined => {
  switch (prerequisite.kind) {
    case "Race":
      return printRacePrerequisite(getInstanceById, locale, prerequisite.Race)
    case "Activatable":
      return printActivatablePrerequisite(
        getInstanceById,
        getResolvedSelectOptionById,
        locale,
        prerequisite.Activatable,
        false,
      )
    case "Text":
      return printTextPrerequisite(locale, prerequisite.Text)
    default:
      return assertExhaustive(prerequisite)
  }
}

/**
 * Print the translation of an animist power prerequisite group.
 */
export const printAnimistPowerPrerequisiteGroup = (
  getInstanceById: GetInstanceById<"AnimistPower">,
  locale: LocaleEnvironment,
  prerequisite: AnimistPowerPrerequisiteGroup,
): PrerequisitePart | undefined =>
  // switch (prerequisite.tag) {
  //   case "AnimistPower":
  //   default:
  //     return assertExhaustive(prerequisite)
  // }
  printAnimistPowerPrerequisite(getInstanceById, locale, prerequisite.AnimistPower)

/**
 * Print the translation of a geode ritual prerequisite group.
 */
export const printGeodeRitualPrerequisiteGroup = (
  getInstanceById: GetInstanceById<"Influence" | ActivatableIdentifier["kind"] | "Aspect">,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  locale: LocaleEnvironment,
  prerequisite: GeodeRitualPrerequisiteGroup,
): PrerequisitePart | undefined => {
  switch (prerequisite.kind) {
    case "Activatable":
      return printActivatablePrerequisite(
        getInstanceById,
        getResolvedSelectOptionById,
        locale,
        prerequisite.Activatable,
        false,
      )
    case "Influence":
      return printInfluencePrerequisite(getInstanceById, locale, prerequisite.Influence)
    default:
      return assertExhaustive(prerequisite)
  }
}

/**
 * Print the translation of an enhancement prerequisite group.
 */
export const printEnhancementPrerequisiteGroup = (
  getInstanceById: GetInstanceById<RatedIdentifier["kind"] | "Enhancement">,
  locale: Pick<LocaleEnvironment, "translate" | "translateMap">,
  prerequisite: EnhancementPrerequisiteGroup,
): PrerequisitePart | undefined => {
  switch (prerequisite.kind) {
    case "Rated":
      return printRatedPrerequisite(getInstanceById, locale, prerequisite.Rated)
    case "Enhancement":
      return printEnhancementPrerequisite(getInstanceById, locale, prerequisite.Enhancement)
    default:
      return assertExhaustive(prerequisite)
  }
}

/**
 * Print the translation of a precondition group.
 */
export const printPreconditionGroup = (
  getInstanceById: GetInstanceById<"Publication">,
  locale: LocaleEnvironment,
  prerequisite: PreconditionGroup,
): PrerequisitePart | undefined => {
  switch (prerequisite.kind) {
    case "Publication":
      return printPublicationPrerequisite(getInstanceById, locale, prerequisite.Publication)
    case "Rule":
      return printRulePrerequisite(locale, prerequisite.Rule)
    case "SexualCharacteristic":
      return printSexualCharacteristicPrerequisite(locale, prerequisite.SexualCharacteristic)
    default:
      return assertExhaustive(prerequisite)
  }
}
