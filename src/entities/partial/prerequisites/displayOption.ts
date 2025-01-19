import { assertExhaustive } from "@optolith/helpers/typeSafety"
import { DisplayOption } from "optolith-database-schema/types/prerequisites/DisplayOption"
import { LocaleEnvironment } from "../../../helpers/locale.js"
import { MISSING_VALUE } from "../unknown.js"
import { PrerequisitePart } from "./part.js"

/**
 * Get the translation of a display option.
 */
export const printDisplayOption = (
  locale: LocaleEnvironment,
  displayOption: DisplayOption,
): PrerequisitePart | undefined => {
  switch (displayOption.tag) {
    case "Hide":
      return undefined
    case "ReplaceWith":
      return {
        value:
          locale.translateMap(displayOption.replace_with.translations) ??
          MISSING_VALUE,
        sentenceType: displayOption.replace_with.sentence_type,
        isMeta: false,
      }
    default:
      return assertExhaustive(displayOption)
  }
}
