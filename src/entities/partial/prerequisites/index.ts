import { isNotNullish } from "@optolith/helpers/nullable"
import { romanize } from "@optolith/helpers/roman"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import {
  SkillWithEnhancementsIdentifier,
  SpecialAbilityIdentifier,
} from "optolith-database-schema/types/_IdentifierGroup"
import {
  AdvantageDisadvantagePrerequisites,
  AnimistPowerPrerequisites,
  ArcaneTraditionPrerequisites,
  DerivedCharacteristicPrerequisites,
  EnhancementPrerequisites,
  GeneralPrerequisites,
  GeodeRitualPrerequisites,
  InfluencePrerequisites,
  LanguagePrerequisites,
  LiturgyPrerequisites,
  PersonalityTraitPrerequisites,
  PlainGeneralPrerequisites,
  PlainPrerequisites,
  PrerequisiteForLevel,
  PrerequisiteGroup,
  PrerequisitesDisjunction,
  PrerequisitesElement,
  PrerequisitesForLevels,
  ProfessionPrerequisites,
  PublicationPrerequisites,
  SpellworkPrerequisites,
} from "optolith-database-schema/types/_Prerequisite"
import { GeneralPrerequisiteGroup } from "optolith-database-schema/types/prerequisites/PrerequisiteGroups"
import { GetById } from "../../../helpers/getTypes.js"
import { LocaleEnvironment } from "../../../helpers/locale.js"
import { MISSING_VALUE } from "../unknown.js"
import { printDisplayOption } from "./displayOption.js"
import { joinPrerequisiteParts, PrerequisitePart } from "./part.js"
import {
  printAdvantageDisadvantagePrerequisiteGroup,
  printAnimistPowerPrerequisiteGroup,
  printArcaneTraditionPrerequisiteGroup,
  printDerivedCharacteristicPrerequisiteGroup,
  printEnhancementPrerequisiteGroup,
  printGeneralPrerequisiteGroup,
  printGeodeRitualPrerequisiteGroup,
  printInfluencePrerequisiteGroup,
  printLanguagePrerequisiteGroup,
  printLiturgyPrerequisiteGroup,
  printPersonalityTraitPrerequisiteGroup,
  printProfessionPrerequisiteGroup,
  printPublicationPrerequisiteGroup,
  printSpellworkPrerequisiteGroup,
} from "./prerequisiteGroups.js"
import { GetResolvedSelectOptionById } from "./single/activatable.js"

type Prerequisite = { tag: string }

const printPrerequisiteGroup = (
  locale: LocaleEnvironment,
  group: PrerequisiteGroup<unknown>,
): PrerequisitePart => ({
  value: locale.translateMap(group.translations) ?? MISSING_VALUE,
  sentenceType: undefined,
  isMeta: false,
})

const printPrerequisitesDisjunction = <T extends Prerequisite>(
  getPrerequisiteTranslation: (prerequisite: T) => PrerequisitePart | undefined,
  locale: LocaleEnvironment,
  disjunction: PrerequisitesDisjunction<T>,
): PrerequisitePart | undefined => {
  if (disjunction.display_option !== undefined) {
    return printDisplayOption(locale, disjunction.display_option)
  }

  const [first, ...other] = disjunction.list
    .map(getPrerequisiteTranslation)
    .filter(isNotNullish)

  if (first === undefined) {
    return undefined
  }

  if (
    disjunction.list.length < 2 ||
    disjunction.list
      .slice(1)
      .every(part => part.tag === disjunction.list[0]!.tag)
  ) {
    return {
      label: first.label,
      value: locale.joinDisjunctionList(
        [first, ...other].map(part => part.value),
      ),
      sentenceType: undefined,
      isMeta: false,
    }
  }

  return {
    value: locale.joinDisjunctionList(
      [first, ...other].map(part => (part.label ?? "") + part.value),
    ),
    sentenceType: undefined,
    isMeta: false,
  }
}

/**
 * Print prerequisites element as a string.
 */
const printPrerequisitesElement = <T extends Prerequisite>(
  printPrerequisite: (prerequisite: T) => PrerequisitePart | undefined,
  locale: LocaleEnvironment,
  element: PrerequisitesElement<T>,
): PrerequisitePart | undefined => {
  switch (element.tag) {
    case "Single":
      return printPrerequisite(element.single)
    case "Disjunction":
      return printPrerequisitesDisjunction(
        printPrerequisite,
        locale,
        element.disjunction,
      )
    case "Group":
      return printPrerequisiteGroup(locale, element.group)
    default:
      return assertExhaustive(element)
  }
}

/**
 * Print plain prerequisites as a string.
 */
const printPlainPrerequisites = <T extends Prerequisite>(
  printPrerequisite: (prerequisite: T) => PrerequisitePart | undefined,
  locale: LocaleEnvironment,
  prerequisites: PlainPrerequisites<T>,
): string =>
  joinPrerequisiteParts(
    locale,
    prerequisites
      .map(element =>
        printPrerequisitesElement(printPrerequisite, locale, element),
      )
      .filter(isNotNullish),
  )

/**
 * Print prerequisite for level as a string.
 */
const printPrerequisiteForLevel = <T extends Prerequisite>(
  printPrerequisite: (prerequisite: T) => PrerequisitePart | undefined,
  locale: LocaleEnvironment,
  value: PrerequisiteForLevel<T>,
) => printPrerequisitesElement(printPrerequisite, locale, value.prerequisite)

/**
 * Print prerequisites for levels as a string.
 */
const printPrerequisitesForLevels = <T extends Prerequisite>(
  printPrerequisite: (prerequisite: T) => PrerequisitePart | undefined,
  locale: LocaleEnvironment,
  value: PrerequisitesForLevels<T>,
  printPreviousLevelPrerequisites?: {
    levels: number
    createPreerequisite: (level: number) => T
  },
): string => {
  const previousLevelPrerequisites: PrerequisitesForLevels<T> =
    printPreviousLevelPrerequisites === undefined
      ? []
      : Array.from(
          { length: printPreviousLevelPrerequisites.levels - 1 },
          (_, i) => ({
            level: i + 2,
            prerequisite: {
              tag: "Single",
              single: printPreviousLevelPrerequisites.createPreerequisite(
                i + 2,
              ),
            },
          }),
        )

  const groupedByLevel = [...value, ...previousLevelPrerequisites].reduce<{
    [level: string]: [number, PrerequisiteForLevel<T>[]]
  }>((acc, prerequisite) => {
    ;(acc[prerequisite.level] ??= [prerequisite.level, []])[1].push(
      prerequisite,
    )
    return acc
  }, {})

  const hasBasePrerequisites = Object.hasOwn(groupedByLevel, 1)

  const sortedByLevel = Object.entries(groupedByLevel).sort(
    ([_a, [a]], [_b, [b]]) => a - b,
  )

  const printedParts = [
    ...(hasBasePrerequisites
      ? []
      : [
          `${locale.translate("Level {0}:", romanize(1))} ${locale.translate(
            "none",
          )}`,
        ]),
    ...sortedByLevel.map(([_, [levelNumber, prerequisites]]) => {
      const level = locale.translate("Level {0}:", romanize(levelNumber))
      const prerequisitesString = joinPrerequisiteParts(
        locale,
        prerequisites
          .map(prerequisite =>
            printPrerequisiteForLevel(printPrerequisite, locale, prerequisite),
          )
          .filter(isNotNullish),
      )
      return `${level} ${prerequisitesString}`
    }),
  ]

  return printedParts.join("; ")
}

/**
 * Print derived characteristic prerequisites as a string.
 */
export const printDerivedCharacteristicPrerequisites = (
  locale: LocaleEnvironment,
  value: DerivedCharacteristicPrerequisites,
): string =>
  printPlainPrerequisites(
    prerequisite =>
      printDerivedCharacteristicPrerequisiteGroup(locale, prerequisite),
    locale,
    value,
  )

/**
 * Print publication prerequisites as a string.
 */
export const printPublicationPrerequisites = (
  getPublicationById: GetById.Static.Publication,
  locale: LocaleEnvironment,
  value: PublicationPrerequisites,
): string =>
  printPlainPrerequisites(
    prerequisite =>
      printPublicationPrerequisiteGroup(
        getPublicationById,
        locale,
        prerequisite,
      ),
    locale,
    value,
  )

/**
 * Print plain general prerequisites as a string.
 */
export const printPlainGeneralPrerequisites = (
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
  value: PlainGeneralPrerequisites,
): string =>
  printPlainPrerequisites(
    prerequisite =>
      printGeneralPrerequisiteGroup(
        getRaceById,
        getCultureById,
        getPactCategoryById,
        getSocialStatusById,
        getStateById,
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
        getAttributeById,
        getSkillById,
        getCloseCombatTechniqueById,
        getRangedCombatTechniqueById,
        getSpellById,
        getRitualById,
        getLiturgicalChantById,
        getCeremonyById,
        getPropertyById,
        getAspectById,
        getResolvedSelectOptionById,
        locale,
        prerequisite,
      ),
    locale,
    value,
  )

/**
 * Print general prerequisites as a string.
 */
export const printGeneralPrerequisites = (
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
  value: GeneralPrerequisites,
  printPreviousLevelPrerequisites?: {
    id: SpecialAbilityIdentifier
    levels: number
  },
): string =>
  printPrerequisitesForLevels(
    prerequisite =>
      printGeneralPrerequisiteGroup(
        getRaceById,
        getCultureById,
        getPactCategoryById,
        getSocialStatusById,
        getStateById,
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
        getAttributeById,
        getSkillById,
        getCloseCombatTechniqueById,
        getRangedCombatTechniqueById,
        getSpellById,
        getRitualById,
        getLiturgicalChantById,
        getCeremonyById,
        getPropertyById,
        getAspectById,
        getResolvedSelectOptionById,
        locale,
        prerequisite,
      ),
    locale,
    value,
    printPreviousLevelPrerequisites === undefined
      ? undefined
      : {
          levels: printPreviousLevelPrerequisites.levels,
          createPreerequisite: (level): GeneralPrerequisiteGroup => ({
            tag: "Activatable",
            activatable: {
              id: printPreviousLevelPrerequisites.id,
              active: true,
              level,
            },
          }),
        },
  )

/**
 * Print profession prerequisites as a string.
 */
export const printProfessionPrerequisites = (
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
  value: ProfessionPrerequisites,
): string =>
  printPlainPrerequisites(
    prerequisite =>
      printProfessionPrerequisiteGroup(
        getRaceById,
        getCultureById,
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
        getAttributeById,
        getSkillById,
        getCloseCombatTechniqueById,
        getRangedCombatTechniqueById,
        getSpellById,
        getRitualById,
        getLiturgicalChantById,
        getCeremonyById,
        getAspectById,
        getResolvedSelectOptionById,
        locale,
        prerequisite,
      ),
    locale,
    value,
  )

/**
 * Print advantage disadvantage prerequisites as a string.
 */
export const printAdvantageDisadvantagePrerequisites = (
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
  value: AdvantageDisadvantagePrerequisites,
  name: string,
  type: "advantage" | "disadvantage",
): string =>
  printPrerequisitesForLevels(
    prerequisite =>
      printAdvantageDisadvantagePrerequisiteGroup(
        getRaceById,
        getCultureById,
        getPactCategoryById,
        getSocialStatusById,
        getStateById,
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
        getAttributeById,
        getSkillById,
        getCloseCombatTechniqueById,
        getRangedCombatTechniqueById,
        getSpellById,
        getRitualById,
        getLiturgicalChantById,
        getCeremonyById,
        getPropertyById,
        getAspectById,
        getResolvedSelectOptionById,
        locale,
        prerequisite,
        name,
        type,
      ),
    locale,
    value,
  )

/**
 * Print arcane tradition prerequisites as a string.
 */
export const printArcaneTraditionPrerequisites = (
  getCultureById: GetById.Static.Culture,
  locale: LocaleEnvironment,
  value: ArcaneTraditionPrerequisites,
): string =>
  printPlainPrerequisites(
    prerequisite =>
      printArcaneTraditionPrerequisiteGroup(
        getCultureById,
        locale,
        prerequisite,
      ),
    locale,
    value,
  )

/**
 * Print personality trait prerequisites as a string.
 */
export const printPersonalityTraitPrerequisites = (
  getCultureById: GetById.Static.Culture,
  locale: LocaleEnvironment,
  value: PersonalityTraitPrerequisites,
): string =>
  printPlainPrerequisites(
    prerequisite =>
      printPersonalityTraitPrerequisiteGroup(
        getCultureById,
        locale,
        prerequisite,
      ),
    locale,
    value,
  )

/**
 * Print spellwork prerequisites as a string.
 */
export const printSpellworkPrerequisites = (
  getAttributeById: GetById.Static.Attribute,
  getSkillById: GetById.Static.Skill,
  getCloseCombatTechniqueById: GetById.Static.CloseCombatTechnique,
  getRangedCombatTechniqueById: GetById.Static.RangedCombatTechnique,
  getSpellById: GetById.Static.Spell,
  getRitualById: GetById.Static.Ritual,
  getLiturgicalChantById: GetById.Static.LiturgicalChant,
  getCeremonyById: GetById.Static.Ceremony,
  locale: LocaleEnvironment,
  value: SpellworkPrerequisites,
): string =>
  printPlainPrerequisites(
    prerequisite =>
      printSpellworkPrerequisiteGroup(
        getAttributeById,
        getSkillById,
        getCloseCombatTechniqueById,
        getRangedCombatTechniqueById,
        getSpellById,
        getRitualById,
        getLiturgicalChantById,
        getCeremonyById,
        locale,
        prerequisite,
      ),
    locale,
    value,
  )

/**
 * Print liturgy prerequisites as a string.
 */
export const printLiturgyPrerequisites = (
  locale: LocaleEnvironment,
  value: LiturgyPrerequisites,
): string =>
  printPlainPrerequisites(
    prerequisite => printLiturgyPrerequisiteGroup(locale, prerequisite),
    locale,
    value,
  )

/**
 * Print influence prerequisites as a string.
 */
export const printInfluencePrerequisites = (
  locale: LocaleEnvironment,
  value: InfluencePrerequisites,
): string =>
  printPlainPrerequisites(
    prerequisite => printInfluencePrerequisiteGroup(locale, prerequisite),
    locale,
    value,
  )

/**
 * Print language prerequisites as a string.
 */
export const printLanguagePrerequisites = (
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
  value: LanguagePrerequisites,
): string =>
  printPrerequisitesForLevels(
    prerequisite =>
      printLanguagePrerequisiteGroup(
        getRaceById,
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
        prerequisite,
      ),
    locale,
    value,
  )

/**
 * Print animist power prerequisites as a string.
 */
export const printAnimistPowerPrerequisites = (
  getAnimistPowerById: GetById.Static.AnimistPower,
  locale: LocaleEnvironment,
  value: AnimistPowerPrerequisites,
): string =>
  printPlainPrerequisites(
    prerequisite =>
      printAnimistPowerPrerequisiteGroup(
        getAnimistPowerById,
        locale,
        prerequisite,
      ),
    locale,
    value,
  )

/**
 * Print geode ritual prerequisites as a string.
 */
export const printGeodeRitualPrerequisites = (
  locale: LocaleEnvironment,
  value: GeodeRitualPrerequisites,
): string =>
  printPlainPrerequisites(
    prerequisite => printGeodeRitualPrerequisiteGroup(locale, prerequisite),
    locale,
    value,
  )

/**
 * Print enhancement prerequisites as a string.
 */
export const printEnhancementPrerequisites = (
  getSpellById: GetById.Static.Spell,
  getRitualById: GetById.Static.Ritual,
  getLiturgicalChantById: GetById.Static.LiturgicalChant,
  getCeremonyById: GetById.Static.Ceremony,
  locale: LocaleEnvironment,
  value: EnhancementPrerequisites,
  parentId: SkillWithEnhancementsIdentifier,
): string =>
  printPlainPrerequisites(
    prerequisite =>
      printEnhancementPrerequisiteGroup(
        getSpellById,
        getRitualById,
        getLiturgicalChantById,
        getCeremonyById,
        locale,
        prerequisite,
        parentId,
      ),
    locale,
    value,
  )
