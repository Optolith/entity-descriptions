import { UI } from "optolith-database-schema/types/UI"
import { Translate, TranslateMap } from "../../src/helpers/translate.js"

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
 * A mocked translate map function.
 */
export const translateMapMock: TranslateMap = map =>
  map?.["en-US"] ?? map?.["de-DE"]
