import { assertExhaustive } from "@optolith/helpers/typeSafety"
import { ResolvedSelectOption } from "optolith-database-schema/cache/activatableSelectOptions"
import {
  ActivatableIdentifier,
  SelectOptionIdentifier,
} from "optolith-database-schema/types/_IdentifierGroup"
import { LocaleMap } from "optolith-database-schema/types/_LocaleMap"
import { ActivatablePrerequisite } from "optolith-database-schema/types/prerequisites/single/ActivatablePrerequisite"
import { GetById } from "../../../../helpers/getTypes.js"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import {
  getNameComponents,
  printActivatableNameChunk,
} from "../../activatableNameChunks.js"
import { printDisplayOption } from "../displayOption.js"
import { PrerequisitePart } from "../part.js"

const getTranslationsForActivatable = (
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
  id: ActivatableIdentifier,
): { translations: LocaleMap<{ name: string }> } | undefined => {
  switch (id.tag) {
    case "Advantage":
      return getAdvantageById(id.advantage)
    case "Disadvantage":
      return getDisadvantageById(id.disadvantage)
    case "AdvancedCombatSpecialAbility":
      return getAdvancedCombatSpecialAbilityById(
        id.advanced_combat_special_ability,
      )
    case "AdvancedKarmaSpecialAbility":
      return getAdvancedKarmaSpecialAbilityById(
        id.advanced_karma_special_ability,
      )
    case "AdvancedMagicalSpecialAbility":
      return getAdvancedMagicalSpecialAbilityById(
        id.advanced_magical_special_ability,
      )
    case "AdvancedSkillSpecialAbility":
      return getAdvancedSkillSpecialAbilityById(
        id.advanced_skill_special_ability,
      )
    case "AncestorGlyph":
      return getAncestorGlyphById(id.ancestor_glyph)
    case "ArcaneOrbEnchantment":
      return getArcaneOrbEnchantmentById(id.arcane_orb_enchantment)
    case "AttireEnchantment":
      return getAttireEnchantmentById(id.attire_enchantment)
    case "BlessedTradition":
      return getBlessedTraditionById(id.blessed_tradition)
    case "BowlEnchantment":
      return getBowlEnchantmentById(id.bowl_enchantment)
    case "BrawlingSpecialAbility":
      return getBrawlingSpecialAbilityById(id.brawling_special_ability)
    case "CauldronEnchantment":
      return getCauldronEnchantmentById(id.cauldron_enchantment)
    case "CeremonialItemSpecialAbility":
      return getCeremonialItemSpecialAbilityById(
        id.ceremonial_item_special_ability,
      )
    case "ChronicleEnchantment":
      return getChronicleEnchantmentById(id.chronicle_enchantment)
    case "CombatSpecialAbility":
      return getCombatSpecialAbilityById(id.combat_special_ability)
    case "CombatStyleSpecialAbility":
      return getCombatStyleSpecialAbilityById(id.combat_style_special_ability)
    case "CommandSpecialAbility":
      return getCommandSpecialAbilityById(id.command_special_ability)
    case "DaggerRitual":
      return getDaggerRitualById(id.dagger_ritual)
    case "FamiliarSpecialAbility":
      return getFamiliarSpecialAbilityById(id.familiar_special_ability)
    case "FatePointSexSpecialAbility":
      return getFatePointSexSpecialAbilityById(
        id.fate_point_sex_special_ability,
      )
    case "FatePointSpecialAbility":
      return getFatePointSpecialAbilityById(id.fate_point_special_ability)
    case "FoolsHatEnchantment":
      return getFoolsHatEnchantmentById(id.fools_hat_enchantment)
    case "GeneralSpecialAbility":
      return getGeneralSpecialAbilityById(id.general_special_ability)
    case "InstrumentEnchantment":
      return getInstrumentEnchantmentById(id.instrument_enchantment)
    case "KarmaSpecialAbility":
      return getKarmaSpecialAbilityById(id.karma_special_ability)
    case "Krallenkettenzauber":
      return getKrallenkettenzauberById(id.krallenkettenzauber)
    case "LiturgicalStyleSpecialAbility":
      return getLiturgicalStyleSpecialAbilityById(
        id.liturgical_style_special_ability,
      )
    case "LycantropicGift":
      return getLycantropicGiftById(id.lycantropic_gift)
    case "MagicalSign":
      return getMagicalSignById(id.magical_sign)
    case "MagicalSpecialAbility":
      return getMagicalSpecialAbilityById(id.magical_special_ability)
    case "MagicalTradition":
      return getMagicalTraditionById(id.magical_tradition)
    case "MagicStyleSpecialAbility":
      return getMagicStyleSpecialAbilityById(id.magic_style_special_ability)
    case "OrbEnchantment":
      return getOrbEnchantmentById(id.orb_enchantment)
    case "PactGift":
      return getPactGiftById(id.pact_gift)
    case "ProtectiveWardingCircleSpecialAbility":
      return getProtectiveWardingCircleSpecialAbilityById(
        id.protective_warding_circle_special_ability,
      )
    case "RingEnchantment":
      return getRingEnchantmentById(id.ring_enchantment)
    case "Sermon":
      return getSermonById(id.sermon)
    case "SexSpecialAbility":
      return getSexSpecialAbilityById(id.sex_special_ability)
    case "SickleRitual":
      return getSickleRitualById(id.sickle_ritual)
    case "SikaryanDrainSpecialAbility":
      return getSikaryanDrainSpecialAbilityById(
        id.sikaryan_drain_special_ability,
      )
    case "SkillStyleSpecialAbility":
      return getSkillStyleSpecialAbilityById(id.skill_style_special_ability)
    case "SpellSwordEnchantment":
      return getSpellSwordEnchantmentById(id.spell_sword_enchantment)
    case "StaffEnchantment":
      return getStaffEnchantmentById(id.staff_enchantment)
    case "ToyEnchantment":
      return getToyEnchantmentById(id.toy_enchantment)
    case "Trinkhornzauber":
      return getTrinkhornzauberById(id.trinkhornzauber)
    case "VampiricGift":
      return getVampiricGiftById(id.vampiric_gift)
    case "Vision":
      return getVisionById(id.vision)
    case "WandEnchantment":
      return getWandEnchantmentById(id.wand_enchantment)
    case "WeaponEnchantment":
      return getWeaponEnchantmentById(id.weapon_enchantment)
    default:
      return assertExhaustive(id)
  }
}
/**
 * Gets a resolved select option by its identifier.
 */
export type GetResolvedSelectOptionById = (
  id: ActivatableIdentifier,
  selectOptionId: SelectOptionIdentifier,
) => ResolvedSelectOption | undefined

const printActivatableName = (
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
  locale: LocaleEnvironment,
  id: ActivatableIdentifier,
  options: SelectOptionIdentifier[] | undefined,
  level: number | undefined,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
) => {
  const entry = getTranslationsForActivatable(
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
    id,
  )

  if (entry === undefined) {
    return undefined
  }

  return getNameComponents(
    getAspectById,
    locale,
    id,
    options,
    level,
    entry.translations,
    t => t.name,
    selectOptionId => getResolvedSelectOptionById(id, selectOptionId),
    false,
  )
}

/**
 * Get the translation of a blessed tradition prerequisite.
 */
export const printActivatablePrerequisite = (
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
  prerequisite: ActivatablePrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale, prerequisite.display_option)
  }

  const nameComponents = printActivatableName(
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
    locale,
    prerequisite.id,
    prerequisite.options,
    prerequisite.level,
    getResolvedSelectOptionById,
  )

  if (nameComponents === undefined) {
    return undefined
  }

  return {
    label: `${
      prerequisite.active
        ? locale.translate("special ability")
        : locale.translate("no special ability")
    } `,
    value: printActivatableNameChunk(locale, nameComponents.full),
    sentenceType: undefined,
    isMeta: false,
  }
}
