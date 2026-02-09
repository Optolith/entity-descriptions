import type { TSONDBTypes } from "optolith-database-schema"
import type { PublicationRefs } from "optolith-database-schema/gen"
import type { TSONDB } from "tsondb"
import type { EntityDescriptionCreator } from "./creator.js"
import { getAttributeEntityDescription } from "./entities/attribute.js"
import { getDerivedCharacteristicEntityDescription } from "./entities/derivedCharacteristic.js"
import { getFocusRuleEntityDescription } from "./entities/focusRule.js"
import {
  getBlessingEntityDescription,
  getCeremonyEntityDescription,
  getLiturgicalChantEntityDescription,
} from "./entities/liturgicalChant.js"
import { getOptionalRuleEntityDescription } from "./entities/optionalRule.js"
import { getSkillEntityDescription } from "./entities/skill.js"
import {
  getCantripEntityDescription,
  getRitualEntityDescription,
  getSpellEntityDescription,
} from "./entities/spell.js"
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
  value: string | number
  noIndent?: boolean
  className?: string
}

type TypedCreator<E extends keyof TSONDBTypes["entityMap"]> =
  EntityDescriptionCreator<
    TSONDBTypes["entityMap"][E] | undefined,
    {
      getInstanceById: GetInstanceById<keyof TSONDBTypes["entityMap"]>
      getAllInstances: GetAllInstances<keyof TSONDBTypes["entityMap"]>
      getChildInstancesForInstanceId: GetAllChildInstancesForParent<
        keyof TSONDBTypes["childEntityMap"]
      >
      idMap: IdMap
    }
  >

const registeredEntityDescriptionCreators = {
  Attribute: getAttributeEntityDescription,
  Skill: getSkillEntityDescription,
  FocusRule: getFocusRuleEntityDescription,
  OptionalRule: getOptionalRuleEntityDescription,
  DerivedCharacteristic: getDerivedCharacteristicEntityDescription,
  Cantrip: getCantripEntityDescription,
  Spell: getSpellEntityDescription,
  Ritual: getRitualEntityDescription,
  Blessing: getBlessingEntityDescription,
  LiturgicalChant: getLiturgicalChantEntityDescription,
  Ceremony: getCeremonyEntityDescription,
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
}

/**
 * Get a JSON representation of the rules text for an entry in the database.
 */
export const getEntityDescription = <E extends AvailableCreatorEntity>(
  database: TSONDB<TSONDBTypes>,
  localeEnv: LocaleEnvironment,
  idMap: IdMap,
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
      getAllInstances: database.getAllInstancesOfEntity.bind(database),
      getChildInstancesForInstanceId: (childEntityName, parentId) =>
        database
          .getAllChildInstanceContainersForParent(childEntityName, parentId)
          .map(container => container.content),
      idMap,
    },
    localeEnv,
    instance,
    instanceId,
  )
}
