import { Translate } from "../../../../helpers/translate.js"
import { responsive, ResponsiveTextSize } from "../../responsiveText.js"

/**
 * Returns the text to prepend for the `is_maximum` property.
 */
export const getTextForIsMaximum = (
  is_maximum: boolean | undefined,
  translate: Translate,
  responsiveText: ResponsiveTextSize
): string => {
  if (is_maximum !== true) {
    return ""
  }

  return responsive(
    responsiveText,
    () => translate("no more than "),
    () => translate("max. ")
  )
}
