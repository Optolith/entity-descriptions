import { filterNonNullable } from "@optolith/helpers/array"
import type { EntityMap } from "optolith-database-schema/gen"
import type { GetInstanceById } from "./helpers/getTypes.js"
import { LocaleEnvironment } from "./helpers/locale.js"
import {
  EntityDescription,
  RawEntityDescription,
  type TypedCreatorData,
} from "./index.js"
import { getReferencesTranslation } from "./references/index.js"

/**
 * A union type of entities with their names as a discriminant property.
 */
export type TaggedEntity<ES extends keyof EntityMap> = {
  [E in ES]: { entity: E; content: EntityMap[E]; id: string }
}[ES]

/**
 * Creates a function that creates the JSON representation of the rules text for
 * a library entry.
 */
export const createEntityDescriptionCreator =
  <
    ES extends keyof EntityMap,
    A extends Partial<TypedCreatorData> & {
      getInstanceById: GetInstanceById<"Publication">
    } = Partial<TypedCreatorData> & {
      getInstanceById: GetInstanceById<"Publication">
    },
  >(
    fn: EntityDescriptionCreator<ES, A, RawEntityDescription>,
  ): EntityDescriptionCreator<ES, A> =>
  (databaseAccessors, locale, entry) => {
    const rawEntry = fn(databaseAccessors, locale, entry)

    if (rawEntry === undefined) {
      return undefined
    }

    return {
      ...rawEntry,
      body: filterNonNullable(rawEntry.body),
      references:
        rawEntry.references === undefined
          ? undefined
          : getReferencesTranslation(
              databaseAccessors.getInstanceById,
              locale,
              rawEntry.references,
            ),
    }
  }

/**
 * A function that creates the JSON representation of the rules text for a
 * library entry.
 */
export type EntityDescriptionCreator<
  ES extends keyof EntityMap = keyof EntityMap,
  A extends { getInstanceById: GetInstanceById<"Publication"> } = {
    getInstanceById: GetInstanceById<"Publication">
  },
  R = EntityDescription,
> = (
  databaseAccessors: A,
  locale: LocaleEnvironment,
  entry: TaggedEntity<ES>,
) => R | undefined
