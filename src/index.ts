import type { TSONDBTypes } from "optolith-database-schema"
import type {
  ResolvedNewSkillApplication,
  ResolvedSelectOption,
  ResolvedSkillUse,
} from "optolith-database-schema/cache"
import type {
  ActivatableIdentifier,
  PublicationRefs,
  Skill_ID,
} from "optolith-database-schema/gen"
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
import { getCurriculumEntityDescription } from "./entities/curriculum.js"
import { getDerivedCharacteristicEntityDescription } from "./entities/derivedCharacteristic.js"
import { getExperienceLevelEntityDescription } from "./entities/experienceLevel.js"
import { getFocusRuleEntityDescription } from "./entities/focusRule.js"
import {
  getBlessingEntityDescription,
  getCeremonyEntityDescription,
  getLiturgicalChantEntityDescription,
} from "./entities/liturgicalChant.js"
import { getOptionalRuleEntityDescription } from "./entities/optionalRule.js"
import type { GetResolvedSelectOptionById } from "./entities/partial/prerequisites/single/activatable.js"
import { getSkillEntityDescription } from "./entities/skill.js"
import {
  getCantripEntityDescription,
  getCurseEntityDescription,
  getRitualEntityDescription,
  getSpellEntityDescription,
} from "./entities/spell.js"
import { getStateEntityDescription } from "./entities/state.js"
import type {
  GetAllChildInstancesForParent,
  GetAllInstances,
  GetInstanceById,
} from "./helpers/getTypes.js"
import type { LocaleEnvironment } from "./helpers/locale.js"

/**
 * A JSON representation of the rules text for a library entry.
 */
export type EntityDescription = {
  title: string
  subtitle?: string
  className: string
  body: EntityDescriptionSection[]
  references?: string
}

/**
 * A JSON representation of the rules text for a library entry that has not been
 * cleaned up.
 */
export type RawEntityDescription = {
  title: string
  subtitle?: string
  className: string
  body: (EntityDescriptionSection | undefined)[]
  references?: PublicationRefs
}

/**
 * A slice of the content of a library entry text.
 */
export type EntityDescriptionSection = {
  label?: string
  value: string | number | EntityDescriptionAtom[]
  noIndent?: boolean
  className?: string
}

/**
 * A single aspect of a library entry text, such as a standalone text or a labeled text.
 */
export type EntityDescriptionAtom = {
  label?: string
  value: string | number
}

/**
 * Data passed to an EntityDescriptionCreator function, with the entity type as a type parameter for better type inference.
 */
export type TypedCreatorData<E extends keyof TSONDBTypes["entityMap"]> = {
  getInstanceById: GetInstanceById<keyof TSONDBTypes["entityMap"]>
  getAllInstances: GetAllInstances<keyof TSONDBTypes["entityMap"]>
  getChildInstancesForInstanceId: GetAllChildInstancesForParent<
    keyof TSONDBTypes["childEntityMap"]
  >
  getResolvedSelectOptionById: GetResolvedSelectOptionById
  getAllResolvedSelectOptions: GetAllResolvedSelectOptions
  getAllResolvedNewSkillApplications: GetAllResolvedNewSkillApplications
  getAllResolvedSkillUses: GetAllResolvedSkillUses
  entityName: E
  idMap: IdMap
}

type TypedCreator<E extends keyof TSONDBTypes["entityMap"]> =
  EntityDescriptionCreator<
    TSONDBTypes["entityMap"][E] | undefined,
    TypedCreatorData<E>
  >

const registeredEntityDescriptionCreators = {
  FocusRule: getFocusRuleEntityDescription,
  OptionalRule: getOptionalRuleEntityDescription,
  AlternativeRule: getAlternativeRuleEntityDescription,
  Condition: getConditionEntityDescription,
  MetaCondition: getMetaConditionEntityDescription,
  State: getStateEntityDescription,
  ExperienceLevel: getExperienceLevelEntityDescription,
  DerivedCharacteristic: getDerivedCharacteristicEntityDescription,
  Advantage: getActivatableEntityDescription,
  Disadvantage: getActivatableEntityDescription,
  Attribute: getAttributeEntityDescription,
  Skill: getSkillEntityDescription,
  CloseCombatTechnique: getCloseCombatTechniqueEntityDescription,
  RangedCombatTechnique: getRangedCombatTechniqueEntityDescription,
  Cantrip: getCantripEntityDescription,
  Spell: getSpellEntityDescription,
  Ritual: getRitualEntityDescription,
  Curse: getCurseEntityDescription,
  Curriculum: getCurriculumEntityDescription,
  Blessing: getBlessingEntityDescription,
  LiturgicalChant: getLiturgicalChantEntityDescription,
  Ceremony: getCeremonyEntityDescription,
  // activatables
  AdvancedCombatSpecialAbility: getActivatableEntityDescription,
  AdvancedKarmaSpecialAbility: getActivatableEntityDescription,
  AdvancedMagicalSpecialAbility: getActivatableEntityDescription,
  AdvancedSkillSpecialAbility: getActivatableEntityDescription,
  AncestorGlyph: getActivatableEntityDescription,
  ArcaneOrbEnchantment: getActivatableEntityDescription,
  AttireEnchantment: getActivatableEntityDescription,
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
  InstrumentEnchantment: getActivatableEntityDescription,
  KarmaSpecialAbility: getActivatableEntityDescription,
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
} satisfies Partial<{ [E in keyof TSONDBTypes["entityMap"]]: TypedCreator<E> }>

type AvailableCreatorEntity = keyof typeof registeredEntityDescriptionCreators

/**
 * Checks if there is a registered description creator for the given entity name.
 */
export const isSupportedEntity = (
  entityName: string,
): entityName is AvailableCreatorEntity =>
  entityName in registeredEntityDescriptionCreators

/**
 * Human-readable aliases for certain identifiers in the database.
 */
export type IdMap = {
  DerivedCharacteristic: Record<
    "LifePoints" | "Spirit" | "Toughness" | "Movement",
    string
  >
  ExperienceLevel: Record<"Experienced", string>
}

/**
 * A function that returns all resolved select options for an activatable entry.
 */
export type GetAllResolvedSelectOptions = (
  id: ActivatableIdentifier,
) => ResolvedSelectOption[]

/**
 * A function that returns all new skill applications for a skill.
 */
export type GetAllResolvedNewSkillApplications = (
  id: Skill_ID,
) => ResolvedNewSkillApplication[]

/**
 * A function that returns all skill uses for a skill.
 */
export type GetAllResolvedSkillUses = (id: Skill_ID) => ResolvedSkillUse[]

/**
 * Get a JSON representation of the rules text for an entry in the database.
 */
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
): EntityDescription | undefined => {
  const creator = registeredEntityDescriptionCreators[
    entityName
  ] as TypedCreator<E>

  const instance = database.getInstanceOfEntityById(entityName, instanceId)

  if (!instance) {
    return undefined
  }

  return creator(
    {
      getInstanceById: database.getInstanceOfEntityById.bind(database),
      getAllInstances: database.getAllInstanceContainersOfEntity.bind(database),
      getChildInstancesForInstanceId: (childEntityName, parentId) =>
        database.getAllChildInstanceContainersForParent(
          childEntityName,
          parentId,
        ),
      getResolvedSelectOptionById,
      getAllResolvedSelectOptions,
      getAllResolvedNewSkillApplications,
      getAllResolvedSkillUses,
      entityName,
      idMap,
    },
    localeEnv,
    instance,
    instanceId,
  )
}
