import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { responsive, ResponsiveTextSize } from "../../responsiveText.js"

/**
 * Wraps the text in a translation that indicates it’s a minimum value.
 */
export const wrapAsMinimum = (
  locale: LocaleEnvironment,
  responsiveTextSize: ResponsiveTextSize,
  text: string,
): string =>
  responsive(
    responsiveTextSize,
    () => locale.translate("at least {$value}", { value: text }),
    () => locale.translate("min. {$value}", { value: text }),
  )

/**
 * Wraps the text in a translation that indicates it’s a minimum value if the
 * `is_minimum` property says it’s a minimum value.
 */
export const wrapIfMinimum = (
  locale: LocaleEnvironment,
  responsiveTextSize: ResponsiveTextSize,
  is_minimum: boolean | undefined,
  text: string,
) =>
  is_minimum === true ? wrapAsMinimum(locale, responsiveTextSize, text) : ""

/**
 * Wraps the text in a translation that indicates it’s a maximum value.
 */
export const wrapAsMaximum = (
  locale: LocaleEnvironment,
  responsiveTextSize: ResponsiveTextSize,
  text: string,
): string =>
  responsive(
    responsiveTextSize,
    () => locale.translate("no more than {$value}", { value: text }),
    () => locale.translate("max. {$value}", { value: text }),
  )

/**
 * Wraps the text in a translation that indicates it’s a maximum value if the
 * `is_maximum` property says it’s a maximum value.
 */
export const wrapIfMaximum = (
  locale: LocaleEnvironment,
  responsiveTextSize: ResponsiveTextSize,
  is_maximum: boolean | undefined,
  text: string,
): string =>
  is_maximum === true ? wrapAsMaximum(locale, responsiveTextSize, text) : ""
