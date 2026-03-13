import { Reader } from "@elyukai/utils/reader"
import { responsiveTranslateR, type StdReader } from "../../reader.js"

/**
 * Wraps the text in a translation that indicates it’s a minimum value.
 */
export const wrapAsMinimum = (text: string): StdReader<string, "t" | "rts"> =>
  responsiveTranslateR("at least {$value}", "min. {$value}", { value: text })

/**
 * Wraps the text in a translation that indicates it’s a minimum value if the
 * `is_minimum` property says it’s a minimum value.
 */
export const wrapIfMinimum = (
  is_minimum: boolean | undefined,
  text: string,
): StdReader<string, "t" | "rts"> => (is_minimum === true ? wrapAsMinimum(text) : Reader.of(text))

/**
 * Wraps the text in a translation that indicates it’s a maximum value.
 */
export const wrapAsMaximum = (text: string): StdReader<string, "t" | "rts"> =>
  responsiveTranslateR("no more than {$value}", "max. {$value}", {
    value: text,
  })

/**
 * Wraps the text in a translation that indicates it’s a maximum value if the
 * `is_maximum` property says it’s a maximum value.
 */
export const wrapIfMaximum = (
  is_maximum: boolean | undefined,
  text: string,
): StdReader<string, "t" | "rts"> => (is_maximum === true ? wrapAsMaximum(text) : Reader.of(text))
