import { on } from "@elyukai/utils/function"
import { numAsc } from "@optolith/helpers/compare"
import { isNotNullish } from "@optolith/helpers/nullable"
import { romanize } from "@optolith/helpers/roman"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
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
  SpecialAbilityIdentifier,
  SpellworkPrerequisites,
  type GeneralPrerequisiteGroup,
} from "optolith-database-schema/gen"
import type { GetInstanceById } from "../../../helpers/getTypes.js"
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

type Prerequisite = { kind: string }

const printPrerequisiteGroup = (
  locale: LocaleEnvironment,
  group: PrerequisiteGroup<unknown>,
): PrerequisitePart => ({
  value: locale.translateMap(group.translations)?.text ?? MISSING_VALUE,
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
      .every(part => part.kind === disjunction.list[0]!.kind)
  ) {
    return {
      label: first.label,
      value: locale.join(
        [first, ...other].map(part => part.value),
        "disjunction",
      ),
      sentenceType: undefined,
      isMeta: false,
    }
  }

  return {
    value: locale.join(
      [first, ...other].map(part => (part.label ?? "") + part.value),
      "disjunction",
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
  switch (element.kind) {
    case "Single":
      return printPrerequisite(element.Single)
    case "Disjunction":
      return printPrerequisitesDisjunction(
        printPrerequisite,
        locale,
        element.Disjunction,
      )
    case "Group":
      return printPrerequisiteGroup(locale, element.Group)
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
              kind: "Single",
              Single: printPreviousLevelPrerequisites.createPreerequisite(
                i + 2,
              ),
            },
          }),
        )

  const groupedByLevel = Map.groupBy(
    [...value, ...previousLevelPrerequisites],
    prerequisite => prerequisite.level,
  )

  const hasBasePrerequisites = groupedByLevel.has(1)

  const sortedByLevel = groupedByLevel
    .entries()
    .toArray()
    .sort(on(item => item[0], numAsc))

  const hasOnlyBasePrerequisites =
    groupedByLevel.size === 1 && hasBasePrerequisites

  const printedParts = [
    ...(hasBasePrerequisites
      ? []
      : [
          `${locale.translate("Level {$level}", {
            level: romanize(1),
          })}: ${locale.translate("none")}`,
        ]),
    ...sortedByLevel.map(([levelNumber, prerequisites]) => {
      const prerequisitesString = joinPrerequisiteParts(
        locale,
        prerequisites
          .map(prerequisite =>
            printPrerequisiteForLevel(printPrerequisite, locale, prerequisite),
          )
          .filter(isNotNullish),
      )

      return hasOnlyBasePrerequisites
        ? prerequisitesString
        : `${locale.translate("Level {$level}", {
            level: romanize(levelNumber),
          })}: ${prerequisitesString}`
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
  getInstanceById: GetInstanceById<"Publication">,
  locale: LocaleEnvironment,
  value: PublicationPrerequisites,
): string =>
  printPlainPrerequisites(
    prerequisite =>
      printPublicationPrerequisiteGroup(getInstanceById, locale, prerequisite),
    locale,
    value,
  )

/**
 * Print plain general prerequisites as a string.
 */
export const printPlainGeneralPrerequisites = (
  getInstanceById: GetInstanceById<
    | "Race"
    | "Culture"
    | "PactCategory"
    | "SocialStatus"
    | "State"
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
    | "Attribute"
    | "Skill"
    | "CloseCombatTechnique"
    | "RangedCombatTechnique"
    | "Spell"
    | "Ritual"
    | "LiturgicalChant"
    | "Ceremony"
    | "Property"
    | "Aspect"
  >,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  locale: LocaleEnvironment,
  value: PlainGeneralPrerequisites,
): string =>
  printPlainPrerequisites(
    prerequisite =>
      printGeneralPrerequisiteGroup(
        getInstanceById,
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
  getInstanceById: GetInstanceById<
    | "Race"
    | "Culture"
    | "PactCategory"
    | "SocialStatus"
    | "State"
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
    | "Attribute"
    | "Skill"
    | "CloseCombatTechnique"
    | "RangedCombatTechnique"
    | "Spell"
    | "Ritual"
    | "LiturgicalChant"
    | "Ceremony"
    | "Property"
    | "Aspect"
  >,
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
        getInstanceById,
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
            kind: "Activatable",
            Activatable: {
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
  getInstanceById: GetInstanceById<
    | "Race"
    | "Culture"
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
    | "Attribute"
    | "Skill"
    | "CloseCombatTechnique"
    | "RangedCombatTechnique"
    | "Spell"
    | "Ritual"
    | "LiturgicalChant"
    | "Ceremony"
    | "Aspect"
  >,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  locale: LocaleEnvironment,
  value: ProfessionPrerequisites,
): string =>
  printPlainPrerequisites(
    prerequisite =>
      printProfessionPrerequisiteGroup(
        getInstanceById,
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
  getInstanceById: GetInstanceById<
    | "Race"
    | "Culture"
    | "PactCategory"
    | "SocialStatus"
    | "State"
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
    | "Attribute"
    | "Skill"
    | "CloseCombatTechnique"
    | "RangedCombatTechnique"
    | "Spell"
    | "Ritual"
    | "LiturgicalChant"
    | "Ceremony"
    | "Property"
    | "Aspect"
  >,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  locale: LocaleEnvironment,
  value: AdvantageDisadvantagePrerequisites,
  name: string,
  type: "Advantage" | "Disadvantage",
): string =>
  printPrerequisitesForLevels(
    prerequisite =>
      printAdvantageDisadvantagePrerequisiteGroup(
        getInstanceById,
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
  getInstanceById: GetInstanceById<"Culture">,
  locale: LocaleEnvironment,
  value: ArcaneTraditionPrerequisites,
): string =>
  printPlainPrerequisites(
    prerequisite =>
      printArcaneTraditionPrerequisiteGroup(
        getInstanceById,
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
  getInstanceById: GetInstanceById<"Culture">,
  locale: LocaleEnvironment,
  value: PersonalityTraitPrerequisites,
): string =>
  printPlainPrerequisites(
    prerequisite =>
      printPersonalityTraitPrerequisiteGroup(
        getInstanceById,
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
  getInstanceById: GetInstanceById<
    | "Attribute"
    | "Skill"
    | "CloseCombatTechnique"
    | "RangedCombatTechnique"
    | "Spell"
    | "Ritual"
    | "LiturgicalChant"
    | "Ceremony"
  >,
  locale: LocaleEnvironment,
  value: SpellworkPrerequisites,
): string =>
  printPlainPrerequisites(
    prerequisite =>
      printSpellworkPrerequisiteGroup(getInstanceById, locale, prerequisite),
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
  getInstanceById: GetInstanceById<
    | "Race"
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
  value: LanguagePrerequisites,
): string =>
  printPrerequisitesForLevels(
    prerequisite =>
      printLanguagePrerequisiteGroup(
        getInstanceById,
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
  getInstanceById: GetInstanceById<"AnimistPower">,
  locale: LocaleEnvironment,
  value: AnimistPowerPrerequisites,
): string =>
  printPlainPrerequisites(
    prerequisite =>
      printAnimistPowerPrerequisiteGroup(getInstanceById, locale, prerequisite),
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
  getInstanceById: GetInstanceById<
    "Spell" | "Ritual" | "LiturgicalChant" | "Ceremony"
  >,
  locale: LocaleEnvironment,
  value: EnhancementPrerequisites,
): string =>
  printPlainPrerequisites(
    prerequisite =>
      printEnhancementPrerequisiteGroup(getInstanceById, locale, prerequisite),
    locale,
    value,
  )
