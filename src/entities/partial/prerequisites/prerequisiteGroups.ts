import { assertExhaustive } from "@optolith/helpers/typeSafety"
import { SkillWithEnhancementsIdentifier } from "optolith-database-schema/types/_IdentifierGroup"
import {
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
  SpellworkPrerequisiteGroup,
} from "optolith-database-schema/types/prerequisites/PrerequisiteGroups"
import { GetById } from "../../../helpers/getTypes.js"
import { LocaleEnvironment } from "../../../helpers/locale.js"
import { PrerequisitePart } from "./part.js"
import {
  GetResolvedSelectOptionById,
  printActivatablePrerequisite,
} from "./single/activatable.js"
import { printAnimistPowerPrerequisite } from "./single/animistPower.js"
import { printBlessedTraditionPrerequisite } from "./single/blessedTradition.js"
import { printCommonSuggestedByRCPPrerequisite } from "./single/commonSuggestedByRCP.js"
import { printCulturePrerequisite } from "./single/culture.js"
import {
  printExternalEnhancementPrerequisite,
  printInternalEnhancementPrerequisite,
} from "./single/enhancement.js"
import { printInfluencePrerequisite } from "./single/influence.js"
import { printMagicalTraditionPrerequisite } from "./single/magicalTradition.js"
import { printNoOtherAncestorBloodAdvantagePrerequisite } from "./single/noOtherAncestorBloodAdvantage.js"
import { printPactPrerequisite } from "./single/pact.js"
import { printPrimaryAttributePrerequisite } from "./single/primaryAttribute.js"
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
): PrerequisitePart | undefined =>
  // switch (prerequisite.tag) {
  //   case "Rule":
  //   default:
  //     return assertExhaustive(prerequisite)
  // }
  printRulePrerequisite(locale, prerequisite.rule)

/**
 * Print the translation of a publication prerequisite group.
 */
export const printPublicationPrerequisiteGroup = (
  getPublicationById: GetById.Static.Publication,
  locale: LocaleEnvironment,
  prerequisite: PublicationPrerequisiteGroup,
): PrerequisitePart | undefined =>
  // switch (prerequisite.tag) {
  //   case "Publication":
  //   default:
  //     return assertExhaustive(prerequisite)
  // }
  printPublicationPrerequisite(
    getPublicationById,
    locale,
    prerequisite.publication,
  )

/**
 * Print the translation of a general prerequisite group.
 */
export const printGeneralPrerequisiteGroup = (
  getRaceById: GetById.Static.Race,
  getCultureById: GetById.Static.Culture,
  getPactCategoryById: GetById.Static.PactCategory,
  getSocialStatusById: GetById.Static.SocialStatus,
  getStateById: GetById.Static.State,
  getAdvantageById: GetById.Static.Advantage,
  getDisadvantageById: GetById.Static.Disadvantage,
  getAdvancedCombatSpecialAbilityById: GetById.Static.AdvancedCombatSpecialAbility,
  getAdvancedKarmaSpecialAbilityById: GetById.Static.AdvancedKarmaSpecialAbility,
  getAdvancedMagicalSpecialAbilityById: GetById.Static.AdvancedMagicalSpecialAbility,
  getAdvancedSkillSpecialAbilityById: GetById.Static.AdvancedSkillSpecialAbility,
  getAncestorGlyphById: GetById.Static.AncestorGlyph,
  getArcaneOrbEnchantmentById: GetById.Static.ArcaneOrbEnchantment,
  getAttireEnchantmentById: GetById.Static.AttireEnchantment,
  getBlessedTraditionById: GetById.Static.BlessedTradition,
  getBowlEnchantmentById: GetById.Static.BowlEnchantment,
  getBrawlingSpecialAbilityById: GetById.Static.BrawlingSpecialAbility,
  getCauldronEnchantmentById: GetById.Static.CauldronEnchantment,
  getCeremonialItemSpecialAbilityById: GetById.Static.CeremonialItemSpecialAbility,
  getChronicleEnchantmentById: GetById.Static.ChronicleEnchantment,
  getCombatSpecialAbilityById: GetById.Static.CombatSpecialAbility,
  getCombatStyleSpecialAbilityById: GetById.Static.CombatStyleSpecialAbility,
  getCommandSpecialAbilityById: GetById.Static.CommandSpecialAbility,
  getDaggerRitualById: GetById.Static.DaggerRitual,
  getFamiliarSpecialAbilityById: GetById.Static.FamiliarSpecialAbility,
  getFatePointSexSpecialAbilityById: GetById.Static.FatePointSexSpecialAbility,
  getFatePointSpecialAbilityById: GetById.Static.FatePointSpecialAbility,
  getFoolsHatEnchantmentById: GetById.Static.FoolsHatEnchantment,
  getGeneralSpecialAbilityById: GetById.Static.GeneralSpecialAbility,
  getInstrumentEnchantmentById: GetById.Static.InstrumentEnchantment,
  getKarmaSpecialAbilityById: GetById.Static.KarmaSpecialAbility,
  getKrallenkettenzauberById: GetById.Static.Krallenkettenzauber,
  getLiturgicalStyleSpecialAbilityById: GetById.Static.LiturgicalStyleSpecialAbility,
  getLycantropicGiftById: GetById.Static.LycantropicGift,
  getMagicalSignById: GetById.Static.MagicalSign,
  getMagicalSpecialAbilityById: GetById.Static.MagicalSpecialAbility,
  getMagicalTraditionById: GetById.Static.MagicalTradition,
  getMagicStyleSpecialAbilityById: GetById.Static.MagicStyleSpecialAbility,
  getOrbEnchantmentById: GetById.Static.OrbEnchantment,
  getPactGiftById: GetById.Static.PactGift,
  getProtectiveWardingCircleSpecialAbilityById: GetById.Static.ProtectiveWardingCircleSpecialAbility,
  getRingEnchantmentById: GetById.Static.RingEnchantment,
  getSermonById: GetById.Static.Sermon,
  getSexSpecialAbilityById: GetById.Static.SexSpecialAbility,
  getSickleRitualById: GetById.Static.SickleRitual,
  getSikaryanDrainSpecialAbilityById: GetById.Static.SikaryanDrainSpecialAbility,
  getSkillStyleSpecialAbilityById: GetById.Static.SkillStyleSpecialAbility,
  getSpellSwordEnchantmentById: GetById.Static.SpellSwordEnchantment,
  getStaffEnchantmentById: GetById.Static.StaffEnchantment,
  getToyEnchantmentById: GetById.Static.ToyEnchantment,
  getTrinkhornzauberById: GetById.Static.Trinkhornzauber,
  getVampiricGiftById: GetById.Static.VampiricGift,
  getVisionById: GetById.Static.Vision,
  getWandEnchantmentById: GetById.Static.WandEnchantment,
  getWeaponEnchantmentById: GetById.Static.WeaponEnchantment,
  getAttributeById: GetById.Static.Attribute,
  getSkillById: GetById.Static.Skill,
  getCloseCombatTechniqueById: GetById.Static.CloseCombatTechnique,
  getRangedCombatTechniqueById: GetById.Static.RangedCombatTechnique,
  getSpellById: GetById.Static.Spell,
  getRitualById: GetById.Static.Ritual,
  getLiturgicalChantById: GetById.Static.LiturgicalChant,
  getCeremonyById: GetById.Static.Ceremony,
  getPropertyById: GetById.Static.Property,
  getAspectById: GetById.Static.Aspect,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  locale: LocaleEnvironment,
  prerequisite: GeneralPrerequisiteGroup,
): PrerequisitePart | undefined => {
  switch (prerequisite.tag) {
    case "Sex":
      return printBinarySexPrerequisite(locale, prerequisite.sex)
    case "Race":
      return printRacePrerequisite(getRaceById, locale, prerequisite.race)
    case "Culture":
      return printCulturePrerequisite(
        getCultureById,
        locale,
        prerequisite.culture,
      )
    case "Pact":
      return printPactPrerequisite(
        getPactCategoryById,
        locale,
        prerequisite.pact,
      )
    case "SocialStatus":
      return printSocialStatusPrerequisite(
        getSocialStatusById,
        locale,
        prerequisite.social_status,
      )
    case "State":
      return printStatePrerequisite(getStateById, locale, prerequisite.state)
    case "Rule":
      return printRulePrerequisite(locale, prerequisite.rule)
    case "PrimaryAttribute":
      return printPrimaryAttributePrerequisite(
        locale,
        prerequisite.primary_attribute,
      )
    case "Activatable":
      return printActivatablePrerequisite(
        getAdvantageById,
        getDisadvantageById,
        getAdvancedCombatSpecialAbilityById,
        getAdvancedKarmaSpecialAbilityById,
        getAdvancedMagicalSpecialAbilityById,
        getAdvancedSkillSpecialAbilityById,
        getAncestorGlyphById,
        getArcaneOrbEnchantmentById,
        getAttireEnchantmentById,
        getBlessedTraditionById,
        getBowlEnchantmentById,
        getBrawlingSpecialAbilityById,
        getCauldronEnchantmentById,
        getCeremonialItemSpecialAbilityById,
        getChronicleEnchantmentById,
        getCombatSpecialAbilityById,
        getCombatStyleSpecialAbilityById,
        getCommandSpecialAbilityById,
        getDaggerRitualById,
        getFamiliarSpecialAbilityById,
        getFatePointSexSpecialAbilityById,
        getFatePointSpecialAbilityById,
        getFoolsHatEnchantmentById,
        getGeneralSpecialAbilityById,
        getInstrumentEnchantmentById,
        getKarmaSpecialAbilityById,
        getKrallenkettenzauberById,
        getLiturgicalStyleSpecialAbilityById,
        getLycantropicGiftById,
        getMagicalSignById,
        getMagicalSpecialAbilityById,
        getMagicalTraditionById,
        getMagicStyleSpecialAbilityById,
        getOrbEnchantmentById,
        getPactGiftById,
        getProtectiveWardingCircleSpecialAbilityById,
        getRingEnchantmentById,
        getSermonById,
        getSexSpecialAbilityById,
        getSickleRitualById,
        getSikaryanDrainSpecialAbilityById,
        getSkillStyleSpecialAbilityById,
        getSpellSwordEnchantmentById,
        getStaffEnchantmentById,
        getToyEnchantmentById,
        getTrinkhornzauberById,
        getVampiricGiftById,
        getVisionById,
        getWandEnchantmentById,
        getWeaponEnchantmentById,
        getAspectById,
        getResolvedSelectOptionById,
        locale,
        prerequisite.activatable,
      )
    case "BlessedTradition":
      return printBlessedTraditionPrerequisite(
        locale,
        prerequisite.blessed_tradition,
      )
    case "MagicalTradition":
      return printMagicalTraditionPrerequisite(
        locale,
        prerequisite.magical_tradition,
      )
    case "Rated":
      return printRatedPrerequisite(
        getAttributeById,
        getSkillById,
        getCloseCombatTechniqueById,
        getRangedCombatTechniqueById,
        getSpellById,
        getRitualById,
        getLiturgicalChantById,
        getCeremonyById,
        locale,
        prerequisite.rated,
      )
    case "RatedMinimumNumber":
      return printRatedMinimumNumberPrerequisite(
        getSkillById,
        getPropertyById,
        getAspectById,
        locale,
        prerequisite.rated_minimum_number,
      )
    case "RatedSum":
      return printRatedSumPrerequisite(
        getSkillById,
        locale,
        prerequisite.rated_sum,
      )
    case "ExternalEnhancement":
      return printExternalEnhancementPrerequisite(
        getSpellById,
        getRitualById,
        getLiturgicalChantById,
        getCeremonyById,
        locale,
        prerequisite.external_enhancement,
      )
    case "Text":
      return printTextPrerequisite(locale, prerequisite.text)
    case "SexualCharacteristic":
      return printSexualCharacteristicPrerequisite(
        locale,
        prerequisite.sexual_characteristic,
      )
    default:
      return assertExhaustive(prerequisite)
  }
}

/**
 * Print the translation of a profession prerequisite group.
 */
export const printProfessionPrerequisiteGroup = (
  getRaceById: GetById.Static.Race,
  getCultureById: GetById.Static.Culture,
  getAdvantageById: GetById.Static.Advantage,
  getDisadvantageById: GetById.Static.Disadvantage,
  getAdvancedCombatSpecialAbilityById: GetById.Static.AdvancedCombatSpecialAbility,
  getAdvancedKarmaSpecialAbilityById: GetById.Static.AdvancedKarmaSpecialAbility,
  getAdvancedMagicalSpecialAbilityById: GetById.Static.AdvancedMagicalSpecialAbility,
  getAdvancedSkillSpecialAbilityById: GetById.Static.AdvancedSkillSpecialAbility,
  getAncestorGlyphById: GetById.Static.AncestorGlyph,
  getArcaneOrbEnchantmentById: GetById.Static.ArcaneOrbEnchantment,
  getAttireEnchantmentById: GetById.Static.AttireEnchantment,
  getBlessedTraditionById: GetById.Static.BlessedTradition,
  getBowlEnchantmentById: GetById.Static.BowlEnchantment,
  getBrawlingSpecialAbilityById: GetById.Static.BrawlingSpecialAbility,
  getCauldronEnchantmentById: GetById.Static.CauldronEnchantment,
  getCeremonialItemSpecialAbilityById: GetById.Static.CeremonialItemSpecialAbility,
  getChronicleEnchantmentById: GetById.Static.ChronicleEnchantment,
  getCombatSpecialAbilityById: GetById.Static.CombatSpecialAbility,
  getCombatStyleSpecialAbilityById: GetById.Static.CombatStyleSpecialAbility,
  getCommandSpecialAbilityById: GetById.Static.CommandSpecialAbility,
  getDaggerRitualById: GetById.Static.DaggerRitual,
  getFamiliarSpecialAbilityById: GetById.Static.FamiliarSpecialAbility,
  getFatePointSexSpecialAbilityById: GetById.Static.FatePointSexSpecialAbility,
  getFatePointSpecialAbilityById: GetById.Static.FatePointSpecialAbility,
  getFoolsHatEnchantmentById: GetById.Static.FoolsHatEnchantment,
  getGeneralSpecialAbilityById: GetById.Static.GeneralSpecialAbility,
  getInstrumentEnchantmentById: GetById.Static.InstrumentEnchantment,
  getKarmaSpecialAbilityById: GetById.Static.KarmaSpecialAbility,
  getKrallenkettenzauberById: GetById.Static.Krallenkettenzauber,
  getLiturgicalStyleSpecialAbilityById: GetById.Static.LiturgicalStyleSpecialAbility,
  getLycantropicGiftById: GetById.Static.LycantropicGift,
  getMagicalSignById: GetById.Static.MagicalSign,
  getMagicalSpecialAbilityById: GetById.Static.MagicalSpecialAbility,
  getMagicalTraditionById: GetById.Static.MagicalTradition,
  getMagicStyleSpecialAbilityById: GetById.Static.MagicStyleSpecialAbility,
  getOrbEnchantmentById: GetById.Static.OrbEnchantment,
  getPactGiftById: GetById.Static.PactGift,
  getProtectiveWardingCircleSpecialAbilityById: GetById.Static.ProtectiveWardingCircleSpecialAbility,
  getRingEnchantmentById: GetById.Static.RingEnchantment,
  getSermonById: GetById.Static.Sermon,
  getSexSpecialAbilityById: GetById.Static.SexSpecialAbility,
  getSickleRitualById: GetById.Static.SickleRitual,
  getSikaryanDrainSpecialAbilityById: GetById.Static.SikaryanDrainSpecialAbility,
  getSkillStyleSpecialAbilityById: GetById.Static.SkillStyleSpecialAbility,
  getSpellSwordEnchantmentById: GetById.Static.SpellSwordEnchantment,
  getStaffEnchantmentById: GetById.Static.StaffEnchantment,
  getToyEnchantmentById: GetById.Static.ToyEnchantment,
  getTrinkhornzauberById: GetById.Static.Trinkhornzauber,
  getVampiricGiftById: GetById.Static.VampiricGift,
  getVisionById: GetById.Static.Vision,
  getWandEnchantmentById: GetById.Static.WandEnchantment,
  getWeaponEnchantmentById: GetById.Static.WeaponEnchantment,
  getAttributeById: GetById.Static.Attribute,
  getSkillById: GetById.Static.Skill,
  getCloseCombatTechniqueById: GetById.Static.CloseCombatTechnique,
  getRangedCombatTechniqueById: GetById.Static.RangedCombatTechnique,
  getSpellById: GetById.Static.Spell,
  getRitualById: GetById.Static.Ritual,
  getLiturgicalChantById: GetById.Static.LiturgicalChant,
  getCeremonyById: GetById.Static.Ceremony,
  getAspectById: GetById.Static.Aspect,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  locale: LocaleEnvironment,
  prerequisite: ProfessionPrerequisiteGroup,
): PrerequisitePart | undefined => {
  switch (prerequisite.tag) {
    case "Sex":
      return printBinarySexPrerequisite(locale, prerequisite.sex)
    case "Race":
      return printRacePrerequisite(getRaceById, locale, prerequisite.race)
    case "Culture":
      return printCulturePrerequisite(
        getCultureById,
        locale,
        prerequisite.culture,
      )
    case "Activatable":
      return printActivatablePrerequisite(
        getAdvantageById,
        getDisadvantageById,
        getAdvancedCombatSpecialAbilityById,
        getAdvancedKarmaSpecialAbilityById,
        getAdvancedMagicalSpecialAbilityById,
        getAdvancedSkillSpecialAbilityById,
        getAncestorGlyphById,
        getArcaneOrbEnchantmentById,
        getAttireEnchantmentById,
        getBlessedTraditionById,
        getBowlEnchantmentById,
        getBrawlingSpecialAbilityById,
        getCauldronEnchantmentById,
        getCeremonialItemSpecialAbilityById,
        getChronicleEnchantmentById,
        getCombatSpecialAbilityById,
        getCombatStyleSpecialAbilityById,
        getCommandSpecialAbilityById,
        getDaggerRitualById,
        getFamiliarSpecialAbilityById,
        getFatePointSexSpecialAbilityById,
        getFatePointSpecialAbilityById,
        getFoolsHatEnchantmentById,
        getGeneralSpecialAbilityById,
        getInstrumentEnchantmentById,
        getKarmaSpecialAbilityById,
        getKrallenkettenzauberById,
        getLiturgicalStyleSpecialAbilityById,
        getLycantropicGiftById,
        getMagicalSignById,
        getMagicalSpecialAbilityById,
        getMagicalTraditionById,
        getMagicStyleSpecialAbilityById,
        getOrbEnchantmentById,
        getPactGiftById,
        getProtectiveWardingCircleSpecialAbilityById,
        getRingEnchantmentById,
        getSermonById,
        getSexSpecialAbilityById,
        getSickleRitualById,
        getSikaryanDrainSpecialAbilityById,
        getSkillStyleSpecialAbilityById,
        getSpellSwordEnchantmentById,
        getStaffEnchantmentById,
        getToyEnchantmentById,
        getTrinkhornzauberById,
        getVampiricGiftById,
        getVisionById,
        getWandEnchantmentById,
        getWeaponEnchantmentById,
        getAspectById,
        getResolvedSelectOptionById,
        locale,
        prerequisite.activatable,
      )
    case "Rated":
      return printRatedPrerequisite(
        getAttributeById,
        getSkillById,
        getCloseCombatTechniqueById,
        getRangedCombatTechniqueById,
        getSpellById,
        getRitualById,
        getLiturgicalChantById,
        getCeremonyById,
        locale,
        prerequisite.rated,
      )
    default:
      return assertExhaustive(prerequisite)
  }
}

/**
 * Print the translation of an advantage/disadvantage prerequisite group.
 */
export const printAdvantageDisadvantagePrerequisiteGroup = (
  getRaceById: GetById.Static.Race,
  getCultureById: GetById.Static.Culture,
  getPactCategoryById: GetById.Static.PactCategory,
  getSocialStatusById: GetById.Static.SocialStatus,
  getStateById: GetById.Static.State,
  getAdvantageById: GetById.Static.Advantage,
  getDisadvantageById: GetById.Static.Disadvantage,
  getAdvancedCombatSpecialAbilityById: GetById.Static.AdvancedCombatSpecialAbility,
  getAdvancedKarmaSpecialAbilityById: GetById.Static.AdvancedKarmaSpecialAbility,
  getAdvancedMagicalSpecialAbilityById: GetById.Static.AdvancedMagicalSpecialAbility,
  getAdvancedSkillSpecialAbilityById: GetById.Static.AdvancedSkillSpecialAbility,
  getAncestorGlyphById: GetById.Static.AncestorGlyph,
  getArcaneOrbEnchantmentById: GetById.Static.ArcaneOrbEnchantment,
  getAttireEnchantmentById: GetById.Static.AttireEnchantment,
  getBlessedTraditionById: GetById.Static.BlessedTradition,
  getBowlEnchantmentById: GetById.Static.BowlEnchantment,
  getBrawlingSpecialAbilityById: GetById.Static.BrawlingSpecialAbility,
  getCauldronEnchantmentById: GetById.Static.CauldronEnchantment,
  getCeremonialItemSpecialAbilityById: GetById.Static.CeremonialItemSpecialAbility,
  getChronicleEnchantmentById: GetById.Static.ChronicleEnchantment,
  getCombatSpecialAbilityById: GetById.Static.CombatSpecialAbility,
  getCombatStyleSpecialAbilityById: GetById.Static.CombatStyleSpecialAbility,
  getCommandSpecialAbilityById: GetById.Static.CommandSpecialAbility,
  getDaggerRitualById: GetById.Static.DaggerRitual,
  getFamiliarSpecialAbilityById: GetById.Static.FamiliarSpecialAbility,
  getFatePointSexSpecialAbilityById: GetById.Static.FatePointSexSpecialAbility,
  getFatePointSpecialAbilityById: GetById.Static.FatePointSpecialAbility,
  getFoolsHatEnchantmentById: GetById.Static.FoolsHatEnchantment,
  getGeneralSpecialAbilityById: GetById.Static.GeneralSpecialAbility,
  getInstrumentEnchantmentById: GetById.Static.InstrumentEnchantment,
  getKarmaSpecialAbilityById: GetById.Static.KarmaSpecialAbility,
  getKrallenkettenzauberById: GetById.Static.Krallenkettenzauber,
  getLiturgicalStyleSpecialAbilityById: GetById.Static.LiturgicalStyleSpecialAbility,
  getLycantropicGiftById: GetById.Static.LycantropicGift,
  getMagicalSignById: GetById.Static.MagicalSign,
  getMagicalSpecialAbilityById: GetById.Static.MagicalSpecialAbility,
  getMagicalTraditionById: GetById.Static.MagicalTradition,
  getMagicStyleSpecialAbilityById: GetById.Static.MagicStyleSpecialAbility,
  getOrbEnchantmentById: GetById.Static.OrbEnchantment,
  getPactGiftById: GetById.Static.PactGift,
  getProtectiveWardingCircleSpecialAbilityById: GetById.Static.ProtectiveWardingCircleSpecialAbility,
  getRingEnchantmentById: GetById.Static.RingEnchantment,
  getSermonById: GetById.Static.Sermon,
  getSexSpecialAbilityById: GetById.Static.SexSpecialAbility,
  getSickleRitualById: GetById.Static.SickleRitual,
  getSikaryanDrainSpecialAbilityById: GetById.Static.SikaryanDrainSpecialAbility,
  getSkillStyleSpecialAbilityById: GetById.Static.SkillStyleSpecialAbility,
  getSpellSwordEnchantmentById: GetById.Static.SpellSwordEnchantment,
  getStaffEnchantmentById: GetById.Static.StaffEnchantment,
  getToyEnchantmentById: GetById.Static.ToyEnchantment,
  getTrinkhornzauberById: GetById.Static.Trinkhornzauber,
  getVampiricGiftById: GetById.Static.VampiricGift,
  getVisionById: GetById.Static.Vision,
  getWandEnchantmentById: GetById.Static.WandEnchantment,
  getWeaponEnchantmentById: GetById.Static.WeaponEnchantment,
  getAttributeById: GetById.Static.Attribute,
  getSkillById: GetById.Static.Skill,
  getCloseCombatTechniqueById: GetById.Static.CloseCombatTechnique,
  getRangedCombatTechniqueById: GetById.Static.RangedCombatTechnique,
  getSpellById: GetById.Static.Spell,
  getRitualById: GetById.Static.Ritual,
  getLiturgicalChantById: GetById.Static.LiturgicalChant,
  getCeremonyById: GetById.Static.Ceremony,
  getPropertyById: GetById.Static.Property,
  getAspectById: GetById.Static.Aspect,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  locale: LocaleEnvironment,
  prerequisite: AdvantageDisadvantagePrerequisiteGroup,
  name: string,
  type: "advantage" | "disadvantage",
): PrerequisitePart | undefined => {
  switch (prerequisite.tag) {
    case "CommonSuggestedByRCP":
      return printCommonSuggestedByRCPPrerequisite(
        locale,
        prerequisite.common_suggested_by_rcp,
        name,
        type,
      )
    case "Sex":
      return printBinarySexPrerequisite(locale, prerequisite.sex)
    case "Race":
      return printRacePrerequisite(getRaceById, locale, prerequisite.race)
    case "Culture":
      return printCulturePrerequisite(
        getCultureById,
        locale,
        prerequisite.culture,
      )
    case "Pact":
      return printPactPrerequisite(
        getPactCategoryById,
        locale,
        prerequisite.pact,
      )
    case "SocialStatus":
      return printSocialStatusPrerequisite(
        getSocialStatusById,
        locale,
        prerequisite.social_status,
      )
    case "State":
      return printStatePrerequisite(getStateById, locale, prerequisite.state)
    case "Rule":
      return printRulePrerequisite(locale, prerequisite.rule)
    case "PrimaryAttribute":
      return printPrimaryAttributePrerequisite(
        locale,
        prerequisite.primary_attribute,
      )
    case "Activatable":
      return printActivatablePrerequisite(
        getAdvantageById,
        getDisadvantageById,
        getAdvancedCombatSpecialAbilityById,
        getAdvancedKarmaSpecialAbilityById,
        getAdvancedMagicalSpecialAbilityById,
        getAdvancedSkillSpecialAbilityById,
        getAncestorGlyphById,
        getArcaneOrbEnchantmentById,
        getAttireEnchantmentById,
        getBlessedTraditionById,
        getBowlEnchantmentById,
        getBrawlingSpecialAbilityById,
        getCauldronEnchantmentById,
        getCeremonialItemSpecialAbilityById,
        getChronicleEnchantmentById,
        getCombatSpecialAbilityById,
        getCombatStyleSpecialAbilityById,
        getCommandSpecialAbilityById,
        getDaggerRitualById,
        getFamiliarSpecialAbilityById,
        getFatePointSexSpecialAbilityById,
        getFatePointSpecialAbilityById,
        getFoolsHatEnchantmentById,
        getGeneralSpecialAbilityById,
        getInstrumentEnchantmentById,
        getKarmaSpecialAbilityById,
        getKrallenkettenzauberById,
        getLiturgicalStyleSpecialAbilityById,
        getLycantropicGiftById,
        getMagicalSignById,
        getMagicalSpecialAbilityById,
        getMagicalTraditionById,
        getMagicStyleSpecialAbilityById,
        getOrbEnchantmentById,
        getPactGiftById,
        getProtectiveWardingCircleSpecialAbilityById,
        getRingEnchantmentById,
        getSermonById,
        getSexSpecialAbilityById,
        getSickleRitualById,
        getSikaryanDrainSpecialAbilityById,
        getSkillStyleSpecialAbilityById,
        getSpellSwordEnchantmentById,
        getStaffEnchantmentById,
        getToyEnchantmentById,
        getTrinkhornzauberById,
        getVampiricGiftById,
        getVisionById,
        getWandEnchantmentById,
        getWeaponEnchantmentById,
        getAspectById,
        getResolvedSelectOptionById,
        locale,
        prerequisite.activatable,
      )
    case "BlessedTradition":
      return printBlessedTraditionPrerequisite(
        locale,
        prerequisite.blessed_tradition,
      )
    case "MagicalTradition":
      return printMagicalTraditionPrerequisite(
        locale,
        prerequisite.magical_tradition,
      )
    case "Rated":
      return printRatedPrerequisite(
        getAttributeById,
        getSkillById,
        getCloseCombatTechniqueById,
        getRangedCombatTechniqueById,
        getSpellById,
        getRitualById,
        getLiturgicalChantById,
        getCeremonyById,
        locale,
        prerequisite.rated,
      )
    case "RatedMinimumNumber":
      return printRatedMinimumNumberPrerequisite(
        getSkillById,
        getPropertyById,
        getAspectById,
        locale,
        prerequisite.rated_minimum_number,
      )
    case "RatedSum":
      return printRatedSumPrerequisite(
        getSkillById,
        locale,
        prerequisite.rated_sum,
      )
    case "ExternalEnhancement":
      return printExternalEnhancementPrerequisite(
        getSpellById,
        getRitualById,
        getLiturgicalChantById,
        getCeremonyById,
        locale,
        prerequisite.external_enhancement,
      )
    case "Text":
      return printTextPrerequisite(locale, prerequisite.text)
    case "NoOtherAncestorBloodAdvantage":
      return printNoOtherAncestorBloodAdvantagePrerequisite(
        locale,
        prerequisite.no_other_ancestor_blood_advantage,
      )
    case "SexualCharacteristic":
      return printSexualCharacteristicPrerequisite(
        locale,
        prerequisite.sexual_characteristic,
      )
    default:
      return assertExhaustive(prerequisite)
  }
}

/**
 * Print the translation of an arcane tradition prerequisite group.
 */
export const printArcaneTraditionPrerequisiteGroup = (
  getCultureById: GetById.Static.Culture,
  locale: LocaleEnvironment,
  prerequisite: ArcaneTraditionPrerequisiteGroup,
): PrerequisitePart | undefined => {
  switch (prerequisite.tag) {
    case "Sex":
      return printBinarySexPrerequisite(locale, prerequisite.sex)
    case "Culture":
      return printCulturePrerequisite(
        getCultureById,
        locale,
        prerequisite.culture,
      )
    default:
      return assertExhaustive(prerequisite)
  }
}

/**
 * Print the translation of a personality trait prerequisite group.
 */
export const printPersonalityTraitPrerequisiteGroup = (
  getCultureById: GetById.Static.Culture,
  locale: LocaleEnvironment,
  prerequisite: PersonalityTraitPrerequisiteGroup,
): PrerequisitePart | undefined => {
  switch (prerequisite.tag) {
    case "Culture":
      return printCulturePrerequisite(
        getCultureById,
        locale,
        prerequisite.culture,
      )
    case "Text":
      return printTextPrerequisite(locale, prerequisite.text)
    default:
      return assertExhaustive(prerequisite)
  }
}

/**
 * Print the translation of a spellwork prerequisite group.
 */
export const printSpellworkPrerequisiteGroup = (
  getAttributeById: GetById.Static.Attribute,
  getSkillById: GetById.Static.Skill,
  getCloseCombatTechniqueById: GetById.Static.CloseCombatTechnique,
  getRangedCombatTechniqueById: GetById.Static.RangedCombatTechnique,
  getSpellById: GetById.Static.Spell,
  getRitualById: GetById.Static.Ritual,
  getLiturgicalChantById: GetById.Static.LiturgicalChant,
  getCeremonyById: GetById.Static.Ceremony,
  locale: LocaleEnvironment,
  prerequisite: SpellworkPrerequisiteGroup,
): PrerequisitePart | undefined => {
  switch (prerequisite.tag) {
    case "Rule":
      return printRulePrerequisite(locale, prerequisite.rule)
    case "Rated":
      return printRatedPrerequisite(
        getAttributeById,
        getSkillById,
        getCloseCombatTechniqueById,
        getRangedCombatTechniqueById,
        getSpellById,
        getRitualById,
        getLiturgicalChantById,
        getCeremonyById,
        locale,
        prerequisite.rated,
      )
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
  printRulePrerequisite(locale, prerequisite.rule)

/**
 * Print the translation of an influence prerequisite group.
 */
export const printInfluencePrerequisiteGroup = (
  locale: LocaleEnvironment,
  prerequisite: InfluencePrerequisiteGroup,
): PrerequisitePart | undefined => {
  switch (prerequisite.tag) {
    case "Influence":
      return printInfluencePrerequisite(locale, prerequisite.influence)
    case "Text":
      return printTextPrerequisite(locale, prerequisite.text)
    default:
      return assertExhaustive(prerequisite)
  }
}

/**
 * Print the translation of a language prerequisite group.
 */
export const printLanguagePrerequisiteGroup = (
  getRaceById: GetById.Static.Race,
  getAdvantageById: GetById.Static.Advantage,
  getDisadvantageById: GetById.Static.Disadvantage,
  getAdvancedCombatSpecialAbilityById: GetById.Static.AdvancedCombatSpecialAbility,
  getAdvancedKarmaSpecialAbilityById: GetById.Static.AdvancedKarmaSpecialAbility,
  getAdvancedMagicalSpecialAbilityById: GetById.Static.AdvancedMagicalSpecialAbility,
  getAdvancedSkillSpecialAbilityById: GetById.Static.AdvancedSkillSpecialAbility,
  getAncestorGlyphById: GetById.Static.AncestorGlyph,
  getArcaneOrbEnchantmentById: GetById.Static.ArcaneOrbEnchantment,
  getAttireEnchantmentById: GetById.Static.AttireEnchantment,
  getBlessedTraditionById: GetById.Static.BlessedTradition,
  getBowlEnchantmentById: GetById.Static.BowlEnchantment,
  getBrawlingSpecialAbilityById: GetById.Static.BrawlingSpecialAbility,
  getCauldronEnchantmentById: GetById.Static.CauldronEnchantment,
  getCeremonialItemSpecialAbilityById: GetById.Static.CeremonialItemSpecialAbility,
  getChronicleEnchantmentById: GetById.Static.ChronicleEnchantment,
  getCombatSpecialAbilityById: GetById.Static.CombatSpecialAbility,
  getCombatStyleSpecialAbilityById: GetById.Static.CombatStyleSpecialAbility,
  getCommandSpecialAbilityById: GetById.Static.CommandSpecialAbility,
  getDaggerRitualById: GetById.Static.DaggerRitual,
  getFamiliarSpecialAbilityById: GetById.Static.FamiliarSpecialAbility,
  getFatePointSexSpecialAbilityById: GetById.Static.FatePointSexSpecialAbility,
  getFatePointSpecialAbilityById: GetById.Static.FatePointSpecialAbility,
  getFoolsHatEnchantmentById: GetById.Static.FoolsHatEnchantment,
  getGeneralSpecialAbilityById: GetById.Static.GeneralSpecialAbility,
  getInstrumentEnchantmentById: GetById.Static.InstrumentEnchantment,
  getKarmaSpecialAbilityById: GetById.Static.KarmaSpecialAbility,
  getKrallenkettenzauberById: GetById.Static.Krallenkettenzauber,
  getLiturgicalStyleSpecialAbilityById: GetById.Static.LiturgicalStyleSpecialAbility,
  getLycantropicGiftById: GetById.Static.LycantropicGift,
  getMagicalSignById: GetById.Static.MagicalSign,
  getMagicalSpecialAbilityById: GetById.Static.MagicalSpecialAbility,
  getMagicalTraditionById: GetById.Static.MagicalTradition,
  getMagicStyleSpecialAbilityById: GetById.Static.MagicStyleSpecialAbility,
  getOrbEnchantmentById: GetById.Static.OrbEnchantment,
  getPactGiftById: GetById.Static.PactGift,
  getProtectiveWardingCircleSpecialAbilityById: GetById.Static.ProtectiveWardingCircleSpecialAbility,
  getRingEnchantmentById: GetById.Static.RingEnchantment,
  getSermonById: GetById.Static.Sermon,
  getSexSpecialAbilityById: GetById.Static.SexSpecialAbility,
  getSickleRitualById: GetById.Static.SickleRitual,
  getSikaryanDrainSpecialAbilityById: GetById.Static.SikaryanDrainSpecialAbility,
  getSkillStyleSpecialAbilityById: GetById.Static.SkillStyleSpecialAbility,
  getSpellSwordEnchantmentById: GetById.Static.SpellSwordEnchantment,
  getStaffEnchantmentById: GetById.Static.StaffEnchantment,
  getToyEnchantmentById: GetById.Static.ToyEnchantment,
  getTrinkhornzauberById: GetById.Static.Trinkhornzauber,
  getVampiricGiftById: GetById.Static.VampiricGift,
  getVisionById: GetById.Static.Vision,
  getWandEnchantmentById: GetById.Static.WandEnchantment,
  getWeaponEnchantmentById: GetById.Static.WeaponEnchantment,
  getAspectById: GetById.Static.Aspect,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  locale: LocaleEnvironment,
  prerequisite: LanguagePrerequisiteGroup,
): PrerequisitePart | undefined => {
  switch (prerequisite.tag) {
    case "Race":
      return printRacePrerequisite(getRaceById, locale, prerequisite.race)
    case "Activatable":
      return printActivatablePrerequisite(
        getAdvantageById,
        getDisadvantageById,
        getAdvancedCombatSpecialAbilityById,
        getAdvancedKarmaSpecialAbilityById,
        getAdvancedMagicalSpecialAbilityById,
        getAdvancedSkillSpecialAbilityById,
        getAncestorGlyphById,
        getArcaneOrbEnchantmentById,
        getAttireEnchantmentById,
        getBlessedTraditionById,
        getBowlEnchantmentById,
        getBrawlingSpecialAbilityById,
        getCauldronEnchantmentById,
        getCeremonialItemSpecialAbilityById,
        getChronicleEnchantmentById,
        getCombatSpecialAbilityById,
        getCombatStyleSpecialAbilityById,
        getCommandSpecialAbilityById,
        getDaggerRitualById,
        getFamiliarSpecialAbilityById,
        getFatePointSexSpecialAbilityById,
        getFatePointSpecialAbilityById,
        getFoolsHatEnchantmentById,
        getGeneralSpecialAbilityById,
        getInstrumentEnchantmentById,
        getKarmaSpecialAbilityById,
        getKrallenkettenzauberById,
        getLiturgicalStyleSpecialAbilityById,
        getLycantropicGiftById,
        getMagicalSignById,
        getMagicalSpecialAbilityById,
        getMagicalTraditionById,
        getMagicStyleSpecialAbilityById,
        getOrbEnchantmentById,
        getPactGiftById,
        getProtectiveWardingCircleSpecialAbilityById,
        getRingEnchantmentById,
        getSermonById,
        getSexSpecialAbilityById,
        getSickleRitualById,
        getSikaryanDrainSpecialAbilityById,
        getSkillStyleSpecialAbilityById,
        getSpellSwordEnchantmentById,
        getStaffEnchantmentById,
        getToyEnchantmentById,
        getTrinkhornzauberById,
        getVampiricGiftById,
        getVisionById,
        getWandEnchantmentById,
        getWeaponEnchantmentById,
        getAspectById,
        getResolvedSelectOptionById,
        locale,
        prerequisite.activatable,
      )
    case "Text":
      return printTextPrerequisite(locale, prerequisite.text)
    default:
      return assertExhaustive(prerequisite)
  }
}

/**
 * Print the translation of an animist power prerequisite group.
 */
export const printAnimistPowerPrerequisiteGroup = (
  getAnimistPowerById: GetById.Static.AnimistPower,
  locale: LocaleEnvironment,
  prerequisite: AnimistPowerPrerequisiteGroup,
): PrerequisitePart | undefined =>
  // switch (prerequisite.tag) {
  //   case "AnimistPower":
  //   default:
  //     return assertExhaustive(prerequisite)
  // }
  printAnimistPowerPrerequisite(
    getAnimistPowerById,
    locale,
    prerequisite.animist_power,
  )

/**
 * Print the translation of a geode ritual prerequisite group.
 */
export const printGeodeRitualPrerequisiteGroup = (
  locale: LocaleEnvironment,
  prerequisite: GeodeRitualPrerequisiteGroup,
): PrerequisitePart | undefined =>
  // switch (prerequisite.tag) {
  //   case "Influence":
  //   default:
  //     return assertExhaustive(prerequisite)
  // }
  printInfluencePrerequisite(locale, prerequisite.influence)

/**
 * Print the translation of an enhancement prerequisite group.
 */
export const printEnhancementPrerequisiteGroup = (
  getSpellById: GetById.Static.Spell,
  getRitualById: GetById.Static.Ritual,
  getLiturgicalChantById: GetById.Static.LiturgicalChant,
  getCeremonyById: GetById.Static.Ceremony,
  locale: LocaleEnvironment,
  prerequisite: EnhancementPrerequisiteGroup,
  parentId: SkillWithEnhancementsIdentifier,
): PrerequisitePart | undefined =>
  // switch (prerequisite.tag) {
  //   case "InternalEnhancement":
  //   default:
  //     return assertExhaustive(prerequisite)
  // }
  printInternalEnhancementPrerequisite(
    getSpellById,
    getRitualById,
    getLiturgicalChantById,
    getCeremonyById,
    locale,
    prerequisite.internal_enhancement,
    parentId,
  )

/**
 * Print the translation of a precondition group.
 */
export const printPreconditionGroup = (
  getPublicationById: GetById.Static.Publication,
  locale: LocaleEnvironment,
  prerequisite: PreconditionGroup,
): PrerequisitePart | undefined => {
  switch (prerequisite.tag) {
    case "Publication":
      return printPublicationPrerequisite(
        getPublicationById,
        locale,
        prerequisite.publication,
      )
    case "SexualCharacteristic":
      return printSexualCharacteristicPrerequisite(
        locale,
        prerequisite.sexual_characteristic,
      )
    default:
      return assertExhaustive(prerequisite)
  }
}
