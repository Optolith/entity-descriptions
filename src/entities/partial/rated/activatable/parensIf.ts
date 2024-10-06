/**
 * Wraps a string in parentheses with a leading space if it is not empty or
 * `undefined`.
 */
export const parensIf = (text: string | undefined): string =>
  text === undefined || text === "" ? "" : ` (${text})`

/**
 * Appends a string in parentheses with a leading space if it is not empty or
 * `undefined`.
 */
export const appendInParensIfNotEmpty = (
  textToAppend: string | undefined,
  text: string
): string =>
  textToAppend === undefined || textToAppend === ""
    ? text
    : `${text} (${textToAppend})`
