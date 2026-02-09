import { Locale } from "optolith-database-schema/gen"

/**
 * The type of all translations
 */
export type Translations = NonNullable<Locale["translations"]>

/**
 * Translates a given key into a string, optionally with parameters.
 */
export type Translate = <K extends keyof Translations>(
  key: K,
  ...rest: Translations[K] extends string & { __params: infer Params }
    ? [params: Params]
    : []
) => string

/**
 * A dictionary of locale identifiers to other values.
 */
export type LocaleMap<T> = Record<string, T>

/**
 * Selects a value from a locale dictionary based on the selected locale.
 */
export type TranslateMap = <T>(map: LocaleMap<T> | undefined) => T | undefined
