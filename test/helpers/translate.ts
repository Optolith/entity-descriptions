import { MessageFormat } from "messageformat"
import type { FormatNumber } from "../../src/helpers/locale.js"
import type { Format, Translate, TranslateMap } from "../../src/helpers/translate.js"

/**
 * A mocked format function.
 */
export const formatMock: Format = (text, args) => new MessageFormat("en", text).format(args)

/**
 * A mocked date format function that formats a date as YYYY-MM-DD.
 */
export const formatDateMock = (date: Date): string => date.toISOString().split("T")[0] ?? ""

/**
 * A mocked number format function.
 */
export const formatNumberMock: FormatNumber = value => value.toFixed()

/**
 * A mocked translate function.
 */
export const translateMock: Translate = (key, ...rest) =>
  new MessageFormat("en", key).format(rest[0] as Record<string, unknown> | undefined)

/**
 * A mocked translate map function.
 */
export const translateMapMock: TranslateMap = map => map?.["en-US"] ?? map?.["de-DE"]
