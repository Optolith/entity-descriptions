import type { TSONDBTypes } from "@optolith/database-schema"
import type {
  ResolvedNewSkillApplication,
  ResolvedSelectOption,
  ResolvedSkillUse,
} from "@optolith/database-schema/cache"
import type { ActivatableIdentifier, Skill_ID } from "@optolith/database-schema/gen"
import type { TSONDB } from "tsondb"
import type { EntityDescriptionCreator } from "./creator.js"
import { getActivatableEntityDescription } from "./entities/activatable.js"
import { getAlternativeRuleEntityDescription } from "./entities/alternativeRule.js"
import { getAttributeEntityDescription } from "./entities/attribute.js"
import {
  getCloseCombatTechniqueEntityDescription,
  getRangedCombatTechniqueEntityDescription,
} from "./entities/combatTechnique.js"
import {
  getConditionEntityDescription,
  getMetaConditionEntityDescription,
} from "./entities/condition.js"
import { getCultureEntityDescription } from "./entities/culture.js"
import { getCurriculumEntityDescription } from "./entities/curriculum.js"
import { getDerivedCharacteristicEntityDescription } from "./entities/derivedCharacteristic.js"
import { getDiseaseEntityDescription } from "./entities/disease.js"
import { getElixirEntityDescription } from "./entities/elixir.js"
import { getEquipmentEntityDescription } from "./entities/equipment.js"
import { getEquipmentPackageEntityDescription } from "./entities/equipmentPackage.js"
import { getExperienceLevelEntityDescription } from "./entities/experienceLevel.js"
import { getFocusRuleEntityDescription } from "./entities/focusRule.js"
import { getInfluenceEntityDescription } from "./entities/influence.js"
import {
  getBlessingEntityDescription,
  getCeremonyEntityDescription,
  getLiturgicalChantEntityDescription,
} from "./entities/liturgicalChant.js"
import { getOptionalRuleEntityDescription } from "./entities/optionalRule.js"
import type { GetResolvedSelectOptionById } from "./entities/partial/prerequisites/single/activatable.js"
import { ResponsiveTextSize } from "./entities/partial/responsiveText.js"
import { getPersonalityTraitEntityDescription } from "./entities/personalityTrait.js"
import { getPoisonEntityDescription } from "./entities/poison.js"
import { getProfessionVersionEntityDescription } from "./entities/profession.js"
import { getRaceEntityDescription } from "./entities/race.js"
import { getSexPracticeEntityDescription } from "./entities/sexPractice.js"
import { getSkillEntityDescription } from "./entities/skill.js"
import {
  getAnimistPowerEntityDescription,
  getBannzeichenEntityDescription,
  getCantripEntityDescription,
  getCurseEntityDescription,
  getDominationRitualEntityDescription,
  getElvenMagicalSongEntityDescription,
  getFamiliarsTrickEntityDescription,
  getGeodeRitualEntityDescription,
  getGoblinRitualEntityDescription,
  getJesterTrickEntityDescription,
  getMagicalDanceEntityDescription,
  getMagicalMelodyEntityDescription,
  getMagicalRuneEntityDescription,
  getRitualEntityDescription,
  getSpellEntityDescription,
  getZibiljaRitualEntityDescription,
} from "./entities/spell.js"
import { getStateEntityDescription } from "./entities/state.js"
import { getTradeSecretEntityDescription } from "./entities/tradeSecret.js"
import type { EntityDescription } from "./entityDescription.js"
import type { StdEnv } from "./env.js"
import type {
  CountInstances,
  GetAllChildInstancesForParent,
  GetAllInstances,
  GetInstanceById,
} from "./helpers/getTypes.js"
import type { LocaleEnvironment } from "./helpers/locale.js"
import type { PublicationOptions } from "./references/publicationOptions.js"

export type { LocaleEnvironment }

/**
 * Data passed to an EntityDescriptionCreator function, with the entity type as a type parameter for better type inference.
 */
export type TypedCreatorData = {
  getInstanceById: GetInstanceById<keyof TSONDBTypes["entityMap"]>
  getAllInstances: GetAllInstances<keyof TSONDBTypes["entityMap"]>
  countInstances: CountInstances<keyof TSONDBTypes["entityMap"]>
  getChildInstancesForInstanceId: GetAllChildInstancesForParent<keyof TSONDBTypes["childEntityMap"]>
  getResolvedSelectOptionById: GetResolvedSelectOptionById
  getAllResolvedSelectOptions: GetAllResolvedSelectOptions
  getAllResolvedNewSkillApplications: GetAllResolvedNewSkillApplications
  getAllResolvedSkillUses: GetAllResolvedSkillUses
  idMap: IdMap
} & StdEnv<"f" | "fd" | "fn" | "t" | "tm" | "lj" | "lc" | "ma" | "rts">

type TypedCreator<E extends keyof TSONDBTypes["entityMap"]> = EntityDescriptionCreator<
  E,
  TypedCreatorData
>

const registeredEntityDescriptionCreators = {
  // rules
  // CoreRule: getCoreRuleEntityDescription,
  FocusRule: getFocusRuleEntityDescription,
  OptionalRule: getOptionalRuleEntityDescription,
  AlternativeRule: getAlternativeRuleEntityDescription,
  Condition: getConditionEntityDescription,
  MetaCondition: getMetaConditionEntityDescription,
  State: getStateEntityDescription,
  // character creation
  ExperienceLevel: getExperienceLevelEntityDescription,
  DerivedCharacteristic: getDerivedCharacteristicEntityDescription,
  Race: getRaceEntityDescription,
  Culture: getCultureEntityDescription,
  ProfessionVersion: getProfessionVersionEntityDescription,
  Advantage: getActivatableEntityDescription,
  Disadvantage: getActivatableEntityDescription,
  // core values
  Attribute: getAttributeEntityDescription,
  Skill: getSkillEntityDescription,
  CloseCombatTechnique: getCloseCombatTechniqueEntityDescription,
  RangedCombatTechnique: getRangedCombatTechniqueEntityDescription,
  // spellworks
  Cantrip: getCantripEntityDescription,
  Spell: getSpellEntityDescription,
  Ritual: getRitualEntityDescription,
  // magical actions
  AnimistPower: getAnimistPowerEntityDescription,
  Curse: getCurseEntityDescription,
  DominationRitual: getDominationRitualEntityDescription,
  ElvenMagicalSong: getElvenMagicalSongEntityDescription,
  GeodeRitual: getGeodeRitualEntityDescription,
  GoblinRitual: getGoblinRitualEntityDescription,
  JesterTrick: getJesterTrickEntityDescription,
  MagicalDance: getMagicalDanceEntityDescription,
  MagicalMelody: getMagicalMelodyEntityDescription,
  MagicalRune: getMagicalRuneEntityDescription,
  ZibiljaRitual: getZibiljaRitualEntityDescription,
  // auxiliary magical
  Curriculum: getCurriculumEntityDescription,
  FamiliarsTrick: getFamiliarsTrickEntityDescription,
  // work of the gods
  Blessing: getBlessingEntityDescription,
  LiturgicalChant: getLiturgicalChantEntityDescription,
  Ceremony: getCeremonyEntityDescription,
  // special abilities and enchantments
  AdvancedCombatSpecialAbility: getActivatableEntityDescription,
  AdvancedKarmaSpecialAbility: getActivatableEntityDescription,
  AdvancedMagicalSpecialAbility: getActivatableEntityDescription,
  AdvancedSkillSpecialAbility: getActivatableEntityDescription,
  AncestorGlyph: getActivatableEntityDescription,
  ArcaneOrbEnchantment: getActivatableEntityDescription,
  AttireEnchantment: getActivatableEntityDescription,
  Bannzeichen: getBannzeichenEntityDescription,
  Beutelzauber: getActivatableEntityDescription,
  BlessedTradition: getActivatableEntityDescription,
  BowlEnchantment: getActivatableEntityDescription,
  BrawlingSpecialAbility: getActivatableEntityDescription,
  CauldronEnchantment: getActivatableEntityDescription,
  CeremonialItemSpecialAbility: getActivatableEntityDescription,
  ChronicleEnchantment: getActivatableEntityDescription,
  CombatSpecialAbility: getActivatableEntityDescription,
  CombatStyleSpecialAbility: getActivatableEntityDescription,
  CommandSpecialAbility: getActivatableEntityDescription,
  DaggerRitual: getActivatableEntityDescription,
  FamiliarSpecialAbility: getActivatableEntityDescription,
  FatePointSexSpecialAbility: getActivatableEntityDescription,
  FatePointSpecialAbility: getActivatableEntityDescription,
  FoolsHatEnchantment: getActivatableEntityDescription,
  GeneralSpecialAbility: getActivatableEntityDescription,
  Haubenzauber: getActivatableEntityDescription,
  Hauerkettenzauber: getActivatableEntityDescription,
  InstrumentEnchantment: getActivatableEntityDescription,
  KarmaSpecialAbility: getActivatableEntityDescription,
  Keulenzauber: getActivatableEntityDescription,
  Krallenkettenzauber: getActivatableEntityDescription,
  Kristallkugelzauber: getActivatableEntityDescription,
  LiturgicalStyleSpecialAbility: getActivatableEntityDescription,
  LycantropicGift: getActivatableEntityDescription,
  MagicalSign: getActivatableEntityDescription,
  MagicalSpecialAbility: getActivatableEntityDescription,
  MagicalTradition: getActivatableEntityDescription,
  MagicStyleSpecialAbility: getActivatableEntityDescription,
  OrbEnchantment: getActivatableEntityDescription,
  PactGift: getActivatableEntityDescription,
  ProtectiveWardingCircleSpecialAbility: getActivatableEntityDescription,
  RingEnchantment: getActivatableEntityDescription,
  Schweinetrommelzauber: getActivatableEntityDescription,
  Sermon: getActivatableEntityDescription,
  SexSpecialAbility: getActivatableEntityDescription,
  SickleRitual: getActivatableEntityDescription,
  SikaryanDrainSpecialAbility: getActivatableEntityDescription,
  SkillStyleSpecialAbility: getActivatableEntityDescription,
  SpellSwordEnchantment: getActivatableEntityDescription,
  StaffEnchantment: getActivatableEntityDescription,
  ToyEnchantment: getActivatableEntityDescription,
  Trinkhornzauber: getActivatableEntityDescription,
  VampiricGift: getActivatableEntityDescription,
  Vision: getActivatableEntityDescription,
  WandEnchantment: getActivatableEntityDescription,
  WeaponEnchantment: getActivatableEntityDescription,
  // auxiliary special ability
  TradeSecret: getTradeSecretEntityDescription,
  // equipment
  Ammunition: getEquipmentEntityDescription,
  Animal: getEquipmentEntityDescription,
  AnimalCare: getEquipmentEntityDescription,
  Armor: getEquipmentEntityDescription,
  BandageOrRemedy: getEquipmentEntityDescription,
  Book: getEquipmentEntityDescription,
  CeremonialItem: getEquipmentEntityDescription,
  Clothes: getEquipmentEntityDescription,
  ClothingPackage: getEquipmentEntityDescription,
  Container: getEquipmentEntityDescription,
  Elixir: getElixirEntityDescription,
  EquipmentOfBlessedOnes: getEquipmentEntityDescription,
  GemOrPreciousStone: getEquipmentEntityDescription,
  IlluminationLightSource: getEquipmentEntityDescription,
  IlluminationRefillOrSupply: getEquipmentEntityDescription,
  Jewelry: getEquipmentEntityDescription,
  Laboratory: getEquipmentEntityDescription,
  Liebesspielzeug: getEquipmentEntityDescription,
  LuxuryGood: getEquipmentEntityDescription,
  MagicalArtifact: getEquipmentEntityDescription,
  MusicalInstrument: getEquipmentEntityDescription,
  Newspaper: getEquipmentEntityDescription,
  OrienteeringAid: getEquipmentEntityDescription,
  Poison: getPoisonEntityDescription,
  RopeOrChain: getEquipmentEntityDescription,
  Stationery: getEquipmentEntityDescription,
  ThievesTool: getEquipmentEntityDescription,
  ToolOfTheTrade: getEquipmentEntityDescription,
  TravelGearOrTool: getEquipmentEntityDescription,
  Vehicle: getEquipmentEntityDescription,
  Weapon: getEquipmentEntityDescription,
  WeaponAccessory: getEquipmentEntityDescription,
  EquipmentPackage: getEquipmentPackageEntityDescription,
  // other
  Disease: getDiseaseEntityDescription,
  AnimalDisease: getDiseaseEntityDescription,
  Influence: getInfluenceEntityDescription,
  PersonalityTrait: getPersonalityTraitEntityDescription,
  SexPractice: getSexPracticeEntityDescription,
} satisfies Partial<{ [E in keyof TSONDBTypes["entityMap"]]: TypedCreator<E> }>

/**
 * The set of entities for which there is a registered description creator function.
 */
export type AvailableCreatorEntity = keyof typeof registeredEntityDescriptionCreators

/**
 * Checks if there is a registered description creator for the given entity name.
 */
export const isSupportedEntity = (entityName: string): entityName is AvailableCreatorEntity =>
  entityName in registeredEntityDescriptionCreators

/**
 * The list of entity names for which there is a registered description creator function.
 */
export const supportedEntities = Object.keys(
  registeredEntityDescriptionCreators,
).toSorted() as AvailableCreatorEntity[]

/**
 * Human-readable aliases for certain identifiers in the database.
 */
export type IdMap = {
  DerivedCharacteristic: Record<
    "LifePoints" | "Spirit" | "Toughness" | "Initiative" | "Movement",
    string
  >
  ExperienceLevel: Record<"Experienced", string>
}

/**
 * A function that returns all resolved select options for an activatable entry.
 */
export type GetAllResolvedSelectOptions = (id: ActivatableIdentifier) => ResolvedSelectOption[]

/**
 * A function that returns all new skill applications for a skill.
 */
export type GetAllResolvedNewSkillApplications = (id: Skill_ID) => ResolvedNewSkillApplication[]

/**
 * A function that returns all skill uses for a skill.
 */
export type GetAllResolvedSkillUses = (id: Skill_ID) => ResolvedSkillUse[]

/**
 * Get a JSON representation of the rules text for an entry in the database.
 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- false positive
export const getEntityDescription = <E extends AvailableCreatorEntity>(
  database: TSONDB<TSONDBTypes>,
  localeEnv: LocaleEnvironment,
  idMap: IdMap,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  getAllResolvedSelectOptions: GetAllResolvedSelectOptions,
  getAllResolvedNewSkillApplications: GetAllResolvedNewSkillApplications,
  getAllResolvedSkillUses: GetAllResolvedSkillUses,
  entityName: E,
  instanceId: string,
  publicationOptions: PublicationOptions,
  responsiveTextSize: "Compressed" | "Full" = "Full",
): EntityDescription<string> | undefined => {
  const creator = registeredEntityDescriptionCreators[entityName] as TypedCreator<E>

  const instance = database.getInstanceOfEntityById(entityName, instanceId)

  if (!instance) {
    return undefined
  }

  return creator(
    {
      getInstanceById: database.getInstanceOfEntityById.bind(database),
      getAllInstances: database.getAllInstanceContainersOfEntity.bind(database),
      countInstances: database.countInstancesOfEntity.bind(database),
      getChildInstancesForInstanceId: (childEntityName, parentId) =>
        database.getAllChildInstanceContainersForParent(childEntityName, parentId),
      getResolvedSelectOptionById,
      getAllResolvedSelectOptions,
      getAllResolvedNewSkillApplications,
      getAllResolvedSkillUses,
      idMap,
      ...localeEnv,
      localeJoin: localeEnv.join,
      localeCompare: localeEnv.compare,
      responsiveTextSize: ResponsiveTextSize[responsiveTextSize],
    },
    localeEnv,
    { entity: entityName, content: instance, id: instanceId },
    { publications: publicationOptions },
  )
}
