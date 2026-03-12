import { MessageFormat } from "messageformat"
import { Translate, TranslateMap, type Format } from "../../src/helpers/translate.js"

/**
 * A mocked format function.
 */
export const formatMock: Format = (text, args) => new MessageFormat("en", text).format(args)

/**
 * A mocked date format function that formats a date as YYYY-MM-DD.
 */
export const formatDateMock = (date: Date): string => date.toISOString().split("T")[0] ?? ""

/**
 * A mocked translate function.
 */
export const translateMock: Translate = (key, ...rest) =>
  new MessageFormat("en", key).format(rest[0] as Record<string, unknown> | undefined)

/**
 * A mocked translate map function.
 */
export const translateMapMock: TranslateMap = map => map?.["en-US"] ?? map?.["de-DE"]
