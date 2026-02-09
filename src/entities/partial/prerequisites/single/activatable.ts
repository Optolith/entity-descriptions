import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type { ResolvedSelectOption } from "optolith-database-schema/cache"
import type {
  ActivatableIdentifier,
  ActivatablePrerequisite,
  RequirableSelectOptionIdentifier,
} from "optolith-database-schema/gen"
import { type GetInstanceById } from "../../../../helpers/getTypes.js"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import type { LocaleMap } from "../../../../helpers/translate.js"
import {
  getNameComponents,
  printActivatableNameChunk,
} from "../../activatableNameChunks.js"
import { printDisplayOption } from "../displayOption.js"
import { PrerequisitePart } from "../part.js"

const getTranslationsForActivatable = (
  getInstanceById: GetInstanceById<
    | "AdvancedCombatSpecialAbility"
    | "AdvancedKarmaSpecialAbility"
    | "AdvancedMagicalSpecialAbility"
    | "AdvancedSkillSpecialAbility"
    | "Advantage"
    | "AncestorGlyph"
    | "ArcaneOrbEnchantment"
    | "AttireEnchantment"
    | "Beutelzauber"
    | "BlessedTradition"
    | "BowlEnchantment"
    | "BrawlingSpecialAbility"
    | "CauldronEnchantment"
    | "CeremonialItemSpecialAbility"
    | "ChronicleEnchantment"
    | "CombatSpecialAbility"
    | "CombatStyleSpecialAbility"
    | "CommandSpecialAbility"
    | "DaggerRitual"
    | "Disadvantage"
    | "FamiliarSpecialAbility"
    | "FatePointSexSpecialAbility"
    | "FatePointSpecialAbility"
    | "FoolsHatEnchantment"
    | "GeneralSpecialAbility"
    | "Haubenzauber"
    | "InstrumentEnchantment"
    | "KarmaSpecialAbility"
    | "Krallenkettenzauber"
    | "Kristallkugelzauber"
    | "LiturgicalStyleSpecialAbility"
    | "LycantropicGift"
    | "MagicalSign"
    | "MagicalSpecialAbility"
    | "MagicalTradition"
    | "MagicStyleSpecialAbility"
    | "OrbEnchantment"
    | "PactGift"
    | "ProtectiveWardingCircleSpecialAbility"
    | "RingEnchantment"
    | "Sermon"
    | "SexSpecialAbility"
    | "SickleRitual"
    | "SikaryanDrainSpecialAbility"
    | "SkillStyleSpecialAbility"
    | "SpellSwordEnchantment"
    | "StaffEnchantment"
    | "ToyEnchantment"
    | "Trinkhornzauber"
    | "VampiricGift"
    | "Vision"
    | "WandEnchantment"
    | "WeaponEnchantment"
  >,
  id: ActivatableIdentifier,
): { translations: LocaleMap<{ name: string }> } | undefined => {
  switch (id.kind) {
    case "Advantage":
      return getInstanceById("Advantage", id.Advantage)
    case "Disadvantage":
      return getInstanceById("Disadvantage", id.Disadvantage)
    case "AdvancedCombatSpecialAbility":
      return getInstanceById(
        "AdvancedCombatSpecialAbility",
        id.AdvancedCombatSpecialAbility,
      )
    case "AdvancedKarmaSpecialAbility":
      return getInstanceById(
        "AdvancedKarmaSpecialAbility",
        id.AdvancedKarmaSpecialAbility,
      )
    case "AdvancedMagicalSpecialAbility":
      return getInstanceById(
        "AdvancedMagicalSpecialAbility",
        id.AdvancedMagicalSpecialAbility,
      )
    case "AdvancedSkillSpecialAbility":
      return getInstanceById(
        "AdvancedSkillSpecialAbility",
        id.AdvancedSkillSpecialAbility,
      )
    case "AncestorGlyph":
      return getInstanceById("AncestorGlyph", id.AncestorGlyph)
    case "ArcaneOrbEnchantment":
      return getInstanceById("ArcaneOrbEnchantment", id.ArcaneOrbEnchantment)
    case "AttireEnchantment":
      return getInstanceById("AttireEnchantment", id.AttireEnchantment)
    case "BlessedTradition":
      return getInstanceById("BlessedTradition", id.BlessedTradition)
    case "Beutelzauber":
      return getInstanceById("Beutelzauber", id.Beutelzauber)
    case "Haubenzauber":
      return getInstanceById("Haubenzauber", id.Haubenzauber)
    case "Kristallkugelzauber":
      return getInstanceById("Kristallkugelzauber", id.Kristallkugelzauber)
    case "BowlEnchantment":
      return getInstanceById("BowlEnchantment", id.BowlEnchantment)
    case "BrawlingSpecialAbility":
      return getInstanceById(
        "BrawlingSpecialAbility",
        id.BrawlingSpecialAbility,
      )
    case "CauldronEnchantment":
      return getInstanceById("CauldronEnchantment", id.CauldronEnchantment)
    case "CeremonialItemSpecialAbility":
      return getInstanceById(
        "CeremonialItemSpecialAbility",
        id.CeremonialItemSpecialAbility,
      )
    case "ChronicleEnchantment":
      return getInstanceById("ChronicleEnchantment", id.ChronicleEnchantment)
    case "CombatSpecialAbility":
      return getInstanceById("CombatSpecialAbility", id.CombatSpecialAbility)
    case "CombatStyleSpecialAbility":
      return getInstanceById(
        "CombatStyleSpecialAbility",
        id.CombatStyleSpecialAbility,
      )
    case "CommandSpecialAbility":
      return getInstanceById("CommandSpecialAbility", id.CommandSpecialAbility)
    case "DaggerRitual":
      return getInstanceById("DaggerRitual", id.DaggerRitual)
    case "FamiliarSpecialAbility":
      return getInstanceById(
        "FamiliarSpecialAbility",
        id.FamiliarSpecialAbility,
      )
    case "FatePointSexSpecialAbility":
      return getInstanceById(
        "FatePointSexSpecialAbility",
        id.FatePointSexSpecialAbility,
      )
    case "FatePointSpecialAbility":
      return getInstanceById(
        "FatePointSpecialAbility",
        id.FatePointSpecialAbility,
      )
    case "FoolsHatEnchantment":
      return getInstanceById("FoolsHatEnchantment", id.FoolsHatEnchantment)
    case "GeneralSpecialAbility":
      return getInstanceById("GeneralSpecialAbility", id.GeneralSpecialAbility)
    case "InstrumentEnchantment":
      return getInstanceById("InstrumentEnchantment", id.InstrumentEnchantment)
    case "KarmaSpecialAbility":
      return getInstanceById("KarmaSpecialAbility", id.KarmaSpecialAbility)
    case "Krallenkettenzauber":
      return getInstanceById("Krallenkettenzauber", id.Krallenkettenzauber)
    case "LiturgicalStyleSpecialAbility":
      return getInstanceById(
        "LiturgicalStyleSpecialAbility",
        id.LiturgicalStyleSpecialAbility,
      )
    case "LycantropicGift":
      return getInstanceById("LycantropicGift", id.LycantropicGift)
    case "MagicalSign":
      return getInstanceById("MagicalSign", id.MagicalSign)
    case "MagicalSpecialAbility":
      return getInstanceById("MagicalSpecialAbility", id.MagicalSpecialAbility)
    case "MagicalTradition":
      return getInstanceById("MagicalTradition", id.MagicalTradition)
    case "MagicStyleSpecialAbility":
      return getInstanceById(
        "MagicStyleSpecialAbility",
        id.MagicStyleSpecialAbility,
      )
    case "OrbEnchantment":
      return getInstanceById("OrbEnchantment", id.OrbEnchantment)
    case "PactGift":
      return getInstanceById("PactGift", id.PactGift)
    case "ProtectiveWardingCircleSpecialAbility":
      return getInstanceById(
        "ProtectiveWardingCircleSpecialAbility",
        id.ProtectiveWardingCircleSpecialAbility,
      )
    case "RingEnchantment":
      return getInstanceById("RingEnchantment", id.RingEnchantment)
    case "Sermon":
      return getInstanceById("Sermon", id.Sermon)
    case "SexSpecialAbility":
      return getInstanceById("SexSpecialAbility", id.SexSpecialAbility)
    case "SickleRitual":
      return getInstanceById("SickleRitual", id.SickleRitual)
    case "SikaryanDrainSpecialAbility":
      return getInstanceById(
        "SikaryanDrainSpecialAbility",
        id.SikaryanDrainSpecialAbility,
      )
    case "SkillStyleSpecialAbility":
      return getInstanceById(
        "SkillStyleSpecialAbility",
        id.SkillStyleSpecialAbility,
      )
    case "SpellSwordEnchantment":
      return getInstanceById("SpellSwordEnchantment", id.SpellSwordEnchantment)
    case "StaffEnchantment":
      return getInstanceById("StaffEnchantment", id.StaffEnchantment)
    case "ToyEnchantment":
      return getInstanceById("ToyEnchantment", id.ToyEnchantment)
    case "Trinkhornzauber":
      return getInstanceById("Trinkhornzauber", id.Trinkhornzauber)
    case "VampiricGift":
      return getInstanceById("VampiricGift", id.VampiricGift)
    case "Vision":
      return getInstanceById("Vision", id.Vision)
    case "WandEnchantment":
      return getInstanceById("WandEnchantment", id.WandEnchantment)
    case "WeaponEnchantment":
      return getInstanceById("WeaponEnchantment", id.WeaponEnchantment)
    default:
      return assertExhaustive(id)
  }
}
/**
 * Gets a resolved select option by its identifier.
 */
export type GetResolvedSelectOptionById = (
  id: ActivatableIdentifier,
  selectOptionId: RequirableSelectOptionIdentifier,
) => ResolvedSelectOption | undefined

const printActivatableName = (
  getInstanceById: GetInstanceById<
    | "Advantage"
    | "Disadvantage"
    | "AdvancedCombatSpecialAbility"
    | "AdvancedKarmaSpecialAbility"
    | "AdvancedMagicalSpecialAbility"
    | "AdvancedSkillSpecialAbility"
    | "AncestorGlyph"
    | "ArcaneOrbEnchantment"
    | "AttireEnchantment"
    | "BlessedTradition"
    | "BowlEnchantment"
    | "BrawlingSpecialAbility"
    | "CauldronEnchantment"
    | "CeremonialItemSpecialAbility"
    | "ChronicleEnchantment"
    | "CombatSpecialAbility"
    | "CombatStyleSpecialAbility"
    | "CommandSpecialAbility"
    | "DaggerRitual"
    | "FamiliarSpecialAbility"
    | "FatePointSexSpecialAbility"
    | "FatePointSpecialAbility"
    | "FoolsHatEnchantment"
    | "GeneralSpecialAbility"
    | "InstrumentEnchantment"
    | "KarmaSpecialAbility"
    | "Krallenkettenzauber"
    | "LiturgicalStyleSpecialAbility"
    | "LycantropicGift"
    | "MagicalSign"
    | "MagicalSpecialAbility"
    | "MagicalTradition"
    | "MagicStyleSpecialAbility"
    | "OrbEnchantment"
    | "PactGift"
    | "ProtectiveWardingCircleSpecialAbility"
    | "RingEnchantment"
    | "Sermon"
    | "SexSpecialAbility"
    | "SickleRitual"
    | "SikaryanDrainSpecialAbility"
    | "SkillStyleSpecialAbility"
    | "SpellSwordEnchantment"
    | "StaffEnchantment"
    | "ToyEnchantment"
    | "Trinkhornzauber"
    | "VampiricGift"
    | "Vision"
    | "WandEnchantment"
    | "WeaponEnchantment"
    | "Aspect"
  >,
  locale: LocaleEnvironment,
  id: ActivatableIdentifier,
  options: RequirableSelectOptionIdentifier[] | undefined,
  level: number | undefined,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
) => {
  const entry = getTranslationsForActivatable(getInstanceById, id)

  if (entry === undefined) {
    return undefined
  }

  return getNameComponents(
    getInstanceById,
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
  getInstanceById: GetInstanceById<
    | "Advantage"
    | "Disadvantage"
    | "AdvancedCombatSpecialAbility"
    | "AdvancedKarmaSpecialAbility"
    | "AdvancedMagicalSpecialAbility"
    | "AdvancedSkillSpecialAbility"
    | "AncestorGlyph"
    | "ArcaneOrbEnchantment"
    | "AttireEnchantment"
    | "BlessedTradition"
    | "BowlEnchantment"
    | "BrawlingSpecialAbility"
    | "CauldronEnchantment"
    | "CeremonialItemSpecialAbility"
    | "ChronicleEnchantment"
    | "CombatSpecialAbility"
    | "CombatStyleSpecialAbility"
    | "CommandSpecialAbility"
    | "DaggerRitual"
    | "FamiliarSpecialAbility"
    | "FatePointSexSpecialAbility"
    | "FatePointSpecialAbility"
    | "FoolsHatEnchantment"
    | "GeneralSpecialAbility"
    | "InstrumentEnchantment"
    | "KarmaSpecialAbility"
    | "Krallenkettenzauber"
    | "LiturgicalStyleSpecialAbility"
    | "LycantropicGift"
    | "MagicalSign"
    | "MagicalSpecialAbility"
    | "MagicalTradition"
    | "MagicStyleSpecialAbility"
    | "OrbEnchantment"
    | "PactGift"
    | "ProtectiveWardingCircleSpecialAbility"
    | "RingEnchantment"
    | "Sermon"
    | "SexSpecialAbility"
    | "SickleRitual"
    | "SikaryanDrainSpecialAbility"
    | "SkillStyleSpecialAbility"
    | "SpellSwordEnchantment"
    | "StaffEnchantment"
    | "ToyEnchantment"
    | "Trinkhornzauber"
    | "VampiricGift"
    | "Vision"
    | "WandEnchantment"
    | "WeaponEnchantment"
    | "Aspect"
  >,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  locale: LocaleEnvironment,
  prerequisite: ActivatablePrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale, prerequisite.display_option)
  }

  const nameComponents = printActivatableName(
    getInstanceById,
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
