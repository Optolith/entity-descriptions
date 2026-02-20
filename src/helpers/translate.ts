import { assertExhaustive } from "@elyukai/utils/typeSafety"
import { Locale } from "optolith-database-schema/gen"
import { ResponsiveTextSize } from "../entities/partial/responsiveText.js"

/**
 * The type of all translations
 */
export type Translations = NonNullable<Locale["translations"]>

/**
 * Translates a given key into a string, optionally with parameters.
 */
export type Translate = <K extends keyof Translations>(
  key: K,
  ...rest: TranslationParamsInArray<K>
) => string

/**
 * Extracts the parameters for a given translation key, or never if the key does not have parameters.
 */
export type TranslationParams<K extends keyof Translations> =
  Translations[K] extends string & { __params: infer Params }
    ? Params
    : undefined

/**
 * Extracts the parameters for a given translation key as an array, or an empty array if the key does not have parameters.
 */
export type TranslationParamsInArray<K extends keyof Translations> =
  Translations[K] extends string & { __params: infer Params }
    ? [params: Params]
    : []

/**
 * A dictionary of locale identifiers to other values.
 */
export type LocaleMap<T> = Record<string, T>

/**
 * Selects a value from a locale dictionary based on the selected locale.
 */
export type TranslateMap = <T>(map: LocaleMap<T> | undefined) => T | undefined

/**
 * The set of translation keys that do not have parameters.
 */
export type TranslationKeysWithoutParams = {
  [K in keyof Translations]-?: Translations[K] extends string & {
    __params: object
  }
    ? never
    : K
}[keyof Translations]

/**
 * Extracts the translation keys that match the parameters.
 */
export type TranslationKeyMatchingParams<Params> = Params extends object
  ? {
      [K in keyof Translations]-?: keyof Params extends keyof TranslationParams<K>
        ? keyof TranslationParams<K> extends keyof Params
          ? K
          : never
        : never
    }[keyof Translations]
  : TranslationKeysWithoutParams

/**
 * Extracts the translation keys that match the parameters of the given key.
 */
export type TranslationKeyMatchingParamsOfKey<T extends keyof Translations> =
  Translations[T] extends object
    ? TranslationKeyMatchingParams<TranslationParams<T>>
    : TranslationKeysWithoutParams

/**
 * Translates a key that has different translations based on the responsive text size, e.g. a full and a compressed version of the same translation.
 */
export const responsiveTranslate = <
  K extends keyof Translations,
  K2 extends TranslationKeyMatchingParamsOfKey<K>,
>(
  translate: Translate,
  responsiveTextSize: ResponsiveTextSize,
  fullKey: K,
  compressedKey: K2,
  ...rest: TranslationParamsInArray<K> & TranslationParamsInArray<K2>
): string => {
  switch (responsiveTextSize) {
    case ResponsiveTextSize.Full:
      return translate(fullKey, ...(rest as TranslationParamsInArray<K>))
    case ResponsiveTextSize.Compressed:
      return translate(compressedKey, ...(rest as TranslationParamsInArray<K2>))
    default:
      return assertExhaustive(responsiveTextSize)
  }
}
