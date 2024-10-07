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
  <T, A = undefined>(
    fn: EntityDescriptionCreator<T, A, RawEntityDescription>
  ): EntityDescriptionCreator<T | undefined, A> =>
  (entry, ...args) => {
    if (entry === undefined) {
      return () => undefined
    }

    return (locale, getPublicationById) => {
      const rawEntry = fn(entry, ...args)(locale, getPublicationById)

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
                getPublicationById,
                locale,
                rawEntry.references
              ),
      }
    }
  }

/**
 * A function that creates the JSON representation of the rules text for a
 * library entry if given further params to the returned function.
 */
export type EntityDescriptionCreator<
  T,
  A = undefined,
  R = EntityDescription
> = (
  entry: T,
  ...args: A extends undefined ? [] : [A]
) => EntityDescriptionConfiguredCreator<R>

/**
 * A function that is already configures for a specific entity and returns the
 * JSON representation of the rules text for a ibrary entry.
 */
export type EntityDescriptionConfiguredCreator<R = EntityDescription> = (
  locale: LocaleEnvironment,
  getPublicationById: GetById.Static.Publication
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
