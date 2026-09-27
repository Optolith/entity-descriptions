import type { Reader } from "@elyukai/utils/reader"

/**
 * Wraps a string in parentheses with a leading space if it is not empty or
 * `undefined`.
 */
export const parensIf = (text: string | undefined): string =>
  text === undefined || text === "" ? "" : ` (${text})`

/**
 * Wraps a string in parentheses with a leading space if it is not empty or
 * `undefined`.
 */
export const parensIfR = <E>(text: Reader<E, string | undefined>): Reader<E, string> =>
  text.map(parensIf)

/**
 * Appends a string in parentheses with a leading space if it is not empty or
 * `undefined`.
 */
export const appendInParensIfNotEmpty = (textToAppend: string | undefined, text: string): string =>
  textToAppend === undefined || textToAppend === "" ? text : `${text} (${textToAppend})`
