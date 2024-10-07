import { UI } from "optolith-database-schema/types/UI"
import { LocaleMap } from "optolith-database-schema/types/_LocaleMap"

/**
 * Translates a given key into a string, optionally with parameters.
 */
export type Translate = <K extends keyof UI>(
  key: K,
  ...params: (string | number)[]
) => string

const insertParams = (str: string, params: (string | number)[]): string =>
  str.replace(
    /\{(?<index>\d+)\}/gu,
    (_match, _p1, _offset, _s, { index: rawIndex }) => {
      const index = Number.parseInt(rawIndex, 10)
      return params[index]?.toString() ?? `{${rawIndex}}`
    },
  )

/**
 * A mocked translate function.
 */
export const translateMock: Translate = <K extends keyof UI>(
  key: K,
  ...options: (string | number)[]
) => insertParams(key, options)

/**
 * Selects a value from a locale dictionary based on the selected locale.
 */
export type TranslateMap = <T>(map: LocaleMap<T> | undefined) => T | undefined
