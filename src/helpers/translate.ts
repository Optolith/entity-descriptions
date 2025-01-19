import { UI } from "optolith-database-schema/types/UI"
import { LocaleMap } from "optolith-database-schema/types/_LocaleMap"

/**
 * Translates a given key into a string, optionally with parameters.
 */
export type Translate = <K extends keyof UI>(
  key: K,
  ...params: (string | number)[]
) => string

/**
 * Selects a value from a locale dictionary based on the selected locale.
 */
export type TranslateMap = <T>(map: LocaleMap<T> | undefined) => T | undefined
