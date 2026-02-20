import { identity } from "@elyukai/utils/function"
import { Reader } from "@elyukai/utils/reader"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type {
  ResponsiveText,
  ResponsiveTextOptional,
  ResponsiveTextReplace,
} from "optolith-database-schema/gen"
import { type LocaleMap } from "../../helpers/translate.js"
import { appendInParensIfNotEmpty } from "./rated/activatable/parensIf.js"
import {
  responsiveTextOptionalR,
  responsiveTextR,
  translateMapR,
  type StdEnv,
} from "./reader.js"
import { MISSING_VALUE } from "./unknown.js"

/**
 * Whether the entry is displayed in a normal or compressed setting. Normal/full
 * usually means a full library entry display, whether compressed usually means
 * the character sheet.
 */
export enum ResponsiveTextSize {
  Compressed,
  Full,
}

/**
 * Executes one of two functions depending on the responsive text size.
 */
export const responsive = <T, A extends unknown[]>(
  size: ResponsiveTextSize,
  full: (...args: A) => T,
  compressed: (...args: A) => T,
  ...args: A
): T => {
  switch (size) {
    case ResponsiveTextSize.Compressed:
      return compressed(...args)
    case ResponsiveTextSize.Full:
      return full(...args)
    default:
      return assertExhaustive(size)
  }
}

/**
 * Returns the responsive text for a given size.
 */
export const getResponsiveText = (
  value: ResponsiveText | undefined,
  size: ResponsiveTextSize,
): string => {
  if (value === undefined) {
    return MISSING_VALUE
  }

  return responsive(
    size,
    () => value.full,
    () => value.compressed,
  )
}

/**
 * Returns the responsive text for a given size if it is defined.
 */
export const getResponsiveTextOptional = (
  value: ResponsiveTextOptional | undefined,
  size: ResponsiveTextSize,
): string | undefined => {
  if (value === undefined) {
    return MISSING_VALUE
  }

  return responsive(
    size,
    () => value.full,
    () => value.compressed,
  )
}

/**
 * Replaces a text with a given value if a replacement is requested, otherwise
 * just return the given value.
 */
export const replaceTextIfNeeded = (
  translations: LocaleMap<{ replacement?: ResponsiveTextReplace }> | undefined,
  valueToReplace: string,
) =>
  translateMapR(translations)
    .with<StdEnv<"tm" | "rts">>(identity)
    .then(translation => {
      if (translation?.replacement === undefined) {
        return Reader.of(valueToReplace)
      }

      return responsiveTextR(translation.replacement).map(note =>
        note.replace("$1", valueToReplace),
      )
    })

/**
 * Appends a note to a given value if a note is requested, otherwise just return
 * the given value.
 */
export const appendNoteIfNeeded = (
  translations: LocaleMap<{ note?: ResponsiveTextOptional }> | undefined,
  valueToAppendTo: string,
) =>
  translateMapR(translations)
    .with<StdEnv<"tm" | "rts">>(identity)
    .then(translation => {
      if (translation?.note === undefined) {
        return Reader.of(valueToAppendTo)
      }

      return responsiveTextOptionalR(translation.note).map(note =>
        appendInParensIfNotEmpty(note, valueToAppendTo),
      )
    })
