/**
 * Some helpers to create Markdown content.
 */

import { mapNullable } from "@elyukai/utils/nullable"
import type { EntityMap } from "@optolith/database-schema/gen"
import { normalizedIdArgs, type IdArgsVariant } from "tsondb/schema/gen"
import type { GetInstanceById } from "../../helpers/getTypes.js"
import type { LocaleMap, TranslateMap } from "../../helpers/translate.js"

/**
 * Creates an attributed string in Markdown format.
 */
export const attributedString = (text: string, rawAttributes: Partial<Record<string, string>>) =>
  `^[${text}](${Object.entries(rawAttributes)
    .filter(
      (pair): pair is [(typeof pair)[0], NonNullable<(typeof pair)[1]>] => pair[1] !== undefined,
    )
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ")})`

/**
 * Display an instance of an entity in Markdown format.
 */
export const attributedInstance = (
  name: string,
  entity: string,
  id?: string,
  other?: Record<string, string>,
) =>
  attributedString(name, {
    ...other,
    entity: `"${entity}"`,
    instance: id === undefined ? undefined : `"${id}"`,
  })

/**
 * Renders the name of an instance in an attributed string.
 */
export const attributedName = <
  E extends {
    [K in keyof EntityMap]: EntityMap[K] extends { translations: LocaleMap<{ name: string }> }
      ? K
      : never
  }[keyof EntityMap],
>(
  translateMap: TranslateMap,
  getInstanceById: GetInstanceById<E>,
  context: string,
  ...args: IdArgsVariant<EntityMap, E>
) => {
  const id = normalizedIdArgs(args)
  return mapNullable(translateMap(getInstanceById(...args)?.translations)?.name, name =>
    attributedInstance(name, id.entityName, id.id, { context: `"${context}"` }),
  )
}

/**
 * Renders the name of an instance according to a custom function.
 */
export const customName = <
  E extends {
    [K in keyof EntityMap]: EntityMap[K] extends { translations: LocaleMap<object> } ? K : never
  }[keyof EntityMap],
>(
  translateMap: TranslateMap,
  getInstanceById: GetInstanceById<E>,
  fn: (translation: EntityMap[E]["translations"][string]) => string,
  ...args: IdArgsVariant<EntityMap, E>
) =>
  mapNullable(translateMap<object>(getInstanceById(...args)?.translations), translation =>
    fn(translation as EntityMap[E]["translations"][string]),
  )

/**
 * Renders the name of an instance according to a custom function in an attributed string.
 */
export const attributedCustomName = <
  E extends {
    [K in keyof EntityMap]: EntityMap[K] extends { translations: LocaleMap<object> } ? K : never
  }[keyof EntityMap],
>(
  translateMap: TranslateMap,
  getInstanceById: GetInstanceById<E>,
  context: string,
  fn: (translation: EntityMap[E]["translations"][string]) => string,
  ...args: IdArgsVariant<EntityMap, E>
) => {
  const id = normalizedIdArgs(args)
  return mapNullable(translateMap<object>(getInstanceById(...args)?.translations), translation =>
    attributedInstance(
      fn(translation as EntityMap[E]["translations"][string]),
      id.entityName,
      id.id,
      { context: `"${context}"` },
    ),
  )
}

/**
 * Renders the name of an instance in an attributed string.
 */
export const attributedNameFromInstance = (
  translateMap: TranslateMap,
  instance: { translations: LocaleMap<{ name: string }> } | undefined,
  context: string,
  ...args: IdArgsVariant<EntityMap, keyof EntityMap>
) => {
  const id = normalizedIdArgs(args)
  return mapNullable(translateMap(instance?.translations)?.name, name =>
    attributedInstance(name, id.entityName, id.id, { context: `"${context}"` }),
  )
}

/**
 * Renders the name of an instance in an attributed string.
 */
export const attributedNameFromTranslation = (
  translation: { name: string } | undefined,
  context: string,
  ...args: IdArgsVariant<EntityMap, keyof EntityMap>
): string | undefined => {
  const id = normalizedIdArgs(args)
  return mapNullable(translation?.name, name =>
    attributedInstance(name, id.entityName, id.id, { context: `"${context}"` }),
  )
}

/**
 * Renders the name of an instance in an attributed string.
 */
export const attributedNameFromSafeTranslation = (
  translation: { name: string },
  context: string,
  ...args: IdArgsVariant<EntityMap, keyof EntityMap>
): string => {
  const id = normalizedIdArgs(args)
  return attributedInstance(translation.name, id.entityName, id.id, { context: `"${context}"` })
}
