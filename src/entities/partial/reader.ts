import { isNotNullish } from "@elyukai/utils/nullable"
import { Reader } from "@elyukai/utils/reader"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type {
  EntityMap,
  FastSkillModificationLevelConfig,
  ResponsiveText,
  ResponsiveTextOptional,
  SkillModificationLevel,
  SlowSkillModificationLevelConfig,
} from "optolith-database-schema/gen"
import type { GetInstanceById } from "../../helpers/getTypes.js"
import type {
  LocaleCompare,
  LocaleJoin,
  LocaleJoinType,
} from "../../helpers/locale.js"
import type {
  LocaleMap,
  Translate,
  TranslateMap,
  TranslationKeyMatchingParamsOfKey,
  TranslationKeysWithoutParams,
  TranslationParamsInArray,
  Translations,
} from "../../helpers/translate.js"
import type { ModifiableParameter } from "./rated/activatable/nonModifiableSuffix.js"
import { Speed } from "./rated/activatable/speed.js"
import { responsive, ResponsiveTextSize } from "./responsiveText.js"
import { formatEnergy, type EnergyUnit } from "./units/energy.js"

/**
 * The standard set of environment properties for readers in this project.
 */
export type EnvMap<E extends keyof EntityMap = never> = {
  translate: Translate
  translateMap: TranslateMap
  localeJoin: LocaleJoin
  localeCompare: LocaleCompare
  responsiveTextSize: ResponsiveTextSize
  speed: Speed
  energyUnit: EnergyUnit
  nonModifiableSuffix?: (
    param: ModifiableParameter,
  ) => TranslationKeysWithoutParams
  getInstanceById: GetInstanceById<E>
}

/**
 * Shortcuts for selecting keys of the shared environment map type.
 */
export type EnvMapAbbr = {
  t: "translate"
  tm: "translateMap"
  lj: "localeJoin"
  lc: "localeCompare"
  rts: "responsiveTextSize"
  s: "speed"
  eu: "energyUnit"
  nms: "nonModifiableSuffix"
  ibi: "getInstanceById"
}

/**
 * The standard set of environment properties for readers in this project.
 *
 * The keys are abbreviated to keep type annotations short.
 */
export type StdEnv<
  in K extends keyof EnvMapAbbr = keyof EnvMapAbbr,
  in E extends keyof EntityMap = never,
> = Pick<EnvMap<E>, EnvMapAbbr[K]>

/**
 * Shortcut for a reader with common environment properties.
 *
 * The keys are abbreviated to keep return type annotations short.
 */
export type StdReader<
  T,
  K extends keyof EnvMapAbbr,
  E extends keyof EntityMap = never,
> = Reader<StdEnv<K, E>, T>

// Specialized constructors for common contexts

/**
 * Creates a value from a translation key.
 */
export const translateR = <K extends keyof Translations>(
  key: K,
  ...rest: TranslationParamsInArray<K>
): Reader<{ translate: Translate }, string> =>
  Reader.asks(env => env.translate(key, ...rest))

/**
 * Returns the `translate` function from the context.
 */
export const translateFnR: Reader<{ translate: Translate }, Translate> =
  Reader.asks(env => env.translate)

/**
 * Takes the appropriate translation from a locale map.
 */
export const translateMapR = <T>(
  map: LocaleMap<T> | undefined,
): Reader<{ translateMap: TranslateMap }, T | undefined> =>
  Reader.asks(env => env.translateMap(map))

/**
 * Returns the `translateMap` function from the context.
 */
export const translateMapFnR: Reader<
  { translateMap: TranslateMap },
  TranslateMap
> = Reader.asks(env => env.translateMap)

/**
 * Joins a list of strings according to the locale’s rules for the given type.
 */
export const localeJoinR = (
  arr: string[],
  type: LocaleJoinType,
): Reader<{ localeJoin: LocaleJoin }, string> =>
  Reader.asks(env => env.localeJoin(arr, type))

/**
 * Returns a function to retrieve an instance from the database by its entity name and ID.
 */
export const getInstanceByIdR = <E extends keyof EntityMap = never>(): Reader<
  { getInstanceById: GetInstanceById<E> },
  GetInstanceById<E>
> => Reader.asks(env => env.getInstanceById)

/**
 * Joins a list of strings according to the locale’s rules for the given type.
 */
export const responsiveLocaleJoinR = (
  arr: string[],
  type: LocaleJoinType,
): Reader<
  { localeJoin: LocaleJoin; responsiveTextSize: ResponsiveTextSize },
  string
> =>
  Reader.asks(({ localeJoin, responsiveTextSize }) =>
    responsive(
      responsiveTextSize,
      () => localeJoin(arr, type),
      () => {
        switch (type) {
          case "conjunction":
            return " + "
          case "disjunction":
            return " / "
          case "unit":
            return " "
          default:
            return assertExhaustive(type)
        }
      },
    ),
  )

/**
 * Compares two strings according to the locale’s sorting rules.
 */
export const localeCompareR: Reader<
  { localeCompare: LocaleCompare },
  LocaleCompare
> = Reader.asks(env => env.localeCompare)

/**
 * Creates a responsive value from two functions that return the value for the full and compressed version, respectively.
 */
export const responsiveR = <T>(
  full: () => T,
  compressed: () => T,
): Reader<{ responsiveTextSize: ResponsiveTextSize }, T> =>
  Reader.asks(({ responsiveTextSize }) =>
    responsive(responsiveTextSize, full, compressed),
  )

/**
 * Creates a responsive value from two functions that return the value for the full and compressed version, respectively.
 */
export const responsiveThenR = <T, RF extends object, RC extends object>(
  full: () => Reader<RF, T>,
  compressed: () => Reader<RC, T>,
): Reader<{ responsiveTextSize: ResponsiveTextSize } & RF & RC, T> =>
  Reader.asks(env => {
    switch (env.responsiveTextSize) {
      case ResponsiveTextSize.Full:
        return full().run(env)
      case ResponsiveTextSize.Compressed:
        return compressed().run(env)
      default:
        return assertExhaustive(env.responsiveTextSize)
    }
  })

/**
 * Creates a responsive value from a translation key that has a full and a compressed version.
 */
export const responsiveTranslateR = <
  K extends keyof Translations,
  K2 extends TranslationKeyMatchingParamsOfKey<K>,
>(
  fullKey: K,
  compressedKey: K2,
  ...rest: TranslationParamsInArray<K> & TranslationParamsInArray<K2>
): Reader<
  { translate: Translate; responsiveTextSize: ResponsiveTextSize },
  string
> =>
  Reader.asks(({ translate, responsiveTextSize }) =>
    responsive(
      responsiveTextSize,
      () => translate(fullKey, ...(rest as TranslationParamsInArray<K>)),
      () => translate(compressedKey, ...(rest as TranslationParamsInArray<K2>)),
    ),
  )

/**
 * Creates a responsive value from a responsive text.
 */
export const responsiveTextR = (
  responsiveText: ResponsiveText,
): Reader<{ responsiveTextSize: ResponsiveTextSize }, string> =>
  Reader.asks(({ responsiveTextSize }) =>
    responsive(
      responsiveTextSize,
      () => responsiveText.full,
      () => responsiveText.compressed,
    ),
  )

/**
 * Creates a responsive value from a responsive text with an optional compressed variant.
 */
export const responsiveTextOptionalR = (
  responsiveText: ResponsiveTextOptional,
): Reader<{ responsiveTextSize: ResponsiveTextSize }, string | undefined> =>
  Reader.asks(({ responsiveTextSize }) =>
    responsive(
      responsiveTextSize,
      () => responsiveText.full,
      () => responsiveText.compressed,
    ),
  )

/**
 * Formats the given energy cost value with the appropriate unit.
 */
export const formatEnergyR = (
  value: string | number,
): Reader<{ translate: Translate; energyUnit: EnergyUnit }, string> =>
  Reader.asks(({ translate, energyUnit }) =>
    formatEnergy(translate, energyUnit, value),
  )

/**
 * Formats the given energy cost value with the appropriate unit based on the entity type.
 */
export const formatEnergyFnR: Reader<
  { translate: Translate; energyUnit: EnergyUnit },
  (value: string | number) => string
> = Reader.asks(
  ({ translate, energyUnit }) =>
    value =>
      formatEnergy(translate, energyUnit, value),
)

type SpeedMap = {
  [Speed.Fast]: FastSkillModificationLevelConfig
  [Speed.Slow]: SlowSkillModificationLevelConfig
}

/**
 * Returns a common value for a skill modification level depending on the speed.
 */
export const modifiableBySpeedR = <
  Fast extends object,
  Slow extends { [K_ in keyof Fast]: unknown },
  K extends keyof Fast,
>(
  key: K,
  level: { fast: Fast; slow: Slow },
): Reader<{ speed: Speed }, (Fast | Slow)[K]> =>
  Reader.asks(({ speed }) => {
    switch (speed) {
      case Speed.Fast:
        return level.fast[key] as (Fast | Slow)[K]
      case Speed.Slow:
        return level.slow[key] as (Fast | Slow)[K]
      default:
        return assertExhaustive(speed)
    }
  })

/**
 * Returns a common value for a skill modification level depending on the speed.
 */
export const modifiableBySpeedOptionalR = <
  Fast extends object,
  Slow extends { [K_ in keyof Fast]: unknown },
  K extends keyof Fast,
>(
  key: K,
  level: { fast?: Fast; slow?: Slow },
): Reader<{ speed: Speed }, (Fast | Slow)[K] | undefined> =>
  Reader.asks(({ speed }) => {
    switch (speed) {
      case Speed.Fast:
        return level.fast?.[key] as (Fast | Slow)[K] | undefined
      case Speed.Slow:
        return level.slow?.[key] as (Fast | Slow)[K] | undefined
      default:
        return assertExhaustive(speed)
    }
  })

/**
 * Returns a common value for a skill modification level depending on the speed.
 */
export const modifyBySpeedR: Reader<
  { speed: Speed },
  <S extends Speed, K extends keyof SpeedMap[S]>(
    key: K,
    level: SkillModificationLevel,
  ) => SpeedMap[S][K]
> = Reader.asks(
  ({ speed }) =>
    <S extends Speed, K extends keyof SpeedMap[S]>(
      key: K,
      level: SkillModificationLevel,
    ) => {
      switch (speed) {
        case Speed.Fast:
          return level.fast[
            key as keyof FastSkillModificationLevelConfig
          ] as SpeedMap[S][K]
        case Speed.Slow:
          return level.slow[
            key as keyof SlowSkillModificationLevelConfig
          ] as SpeedMap[S][K]
        default:
          return assertExhaustive(speed)
      }
    },
)

/**
 * Returns the default values wrapped in a reader if the value is nullish, otherwise applies the given function to the value and returns the result.
 */
export const mapNullableR =
  <T, U, R>(defaultValue: U, fn: (value: NonNullable<T>) => Reader<U, R>) =>
  (value: T) =>
    isNotNullish(value) ? fn(value) : Reader.of(defaultValue)
