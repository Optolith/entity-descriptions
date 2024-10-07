import { filterNonNullable } from "@optolith/helpers/array"
import { PublicationRefs } from "optolith-database-schema/types/source/_PublicationRef"
import { GetById } from "./helpers/getTypes.js"
import { LocaleEnvironment } from "./helpers/locale.js"
import { getReferencesTranslation } from "./references/index.js"

/**
 * Creates a function that creates the JSON representation of the rules text for
 * a library entry.
 */
export const createEntityDescriptionCreator =
  <T, A extends object = object>(
    fn: EntityDescriptionCreator<T, A, RawEntityDescription>,
  ): EntityDescriptionCreator<T | undefined, A> =>
  (databaseAccessors, locale, entry) => {
    if (entry === undefined) {
      return undefined
    }

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
              databaseAccessors.getPublicationById,
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
  A extends object = object,
  R = EntityDescription,
> = (
  databaseAccessors: A & { getPublicationById: GetById.Static.Publication },
  locale: LocaleEnvironment,
  entry: T,
) => R | undefined

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
