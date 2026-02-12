import { filterNonNullable } from "@optolith/helpers/array"
import type { TSONDBTypes } from "optolith-database-schema"
import type { GetInstanceById } from "./helpers/getTypes.js"
import { LocaleEnvironment } from "./helpers/locale.js"
import {
  EntityDescription,
  RawEntityDescription,
  type TypedCreatorData,
} from "./index.js"
import { getReferencesTranslation } from "./references/index.js"

/**
 * Creates a function that creates the JSON representation of the rules text for
 * a library entry.
 */
export const createEntityDescriptionCreator =
  <
    T,
    A extends Partial<TypedCreatorData<keyof TSONDBTypes["entityMap"]>> & {
      getInstanceById: GetInstanceById<"Publication">
    } = Partial<TypedCreatorData<keyof TSONDBTypes["entityMap"]>> & {
      getInstanceById: GetInstanceById<"Publication">
    },
  >(
    fn: EntityDescriptionCreator<T, A, RawEntityDescription>,
  ): EntityDescriptionCreator<T | undefined, A> =>
  (databaseAccessors, locale, entry, id) => {
    if (entry === undefined) {
      return undefined
    }

    const rawEntry = fn(databaseAccessors, locale, entry, id)

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
  T,
  A extends { getInstanceById: GetInstanceById<"Publication"> } = {
    getInstanceById: GetInstanceById<"Publication">
  },
  R = EntityDescription,
> = (
  databaseAccessors: A,
  locale: LocaleEnvironment,
  entry: T,
  id: string,
) => R | undefined
