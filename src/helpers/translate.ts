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

type TranslationParamsInArray<K extends keyof Translations> =
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

type TranslationKeysWithoutParams = {
  [K in keyof Translations]-?: Translations[K] extends string & {
    __params: object
  }
    ? never
    : K
}[keyof Translations]

type TranslationKeyMatchingParams<Params> = Params extends object
  ? {
      [K in keyof Translations]-?: Translations[K] extends string & {
        __params: Params
      }
        ? K
        : never
    }[keyof Translations]
  : TranslationKeysWithoutParams

type TranslationKeyMatchingParamsOfKey<K extends keyof Translations> =
  TranslationKeyMatchingParams<TranslationParams<K>>

/**
 * Translates a key that has different translations based on the responsive text size, e.g. a full and a compressed version of the same translation.
 */
export const responsiveTranslate = <K extends keyof Translations>(
  translate: Translate,
  responsiveTextSize: ResponsiveTextSize,
  fullKey: K,
  compressedKey: TranslationKeyMatchingParamsOfKey<K>,
  ...rest: TranslationParamsInArray<K>
): string => {
  switch (responsiveTextSize) {
    case ResponsiveTextSize.Full:
      return translate(fullKey, ...rest)
    case ResponsiveTextSize.Compressed:
      return translate(
        compressedKey,
        ...(rest as unknown as TranslationParamsInArray<typeof compressedKey>),
      )
    default:
      return assertExhaustive(responsiveTextSize)
  }
}
