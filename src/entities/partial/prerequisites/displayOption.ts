import { assertExhaustive } from "@optolith/helpers/typeSafety"
import { DisplayOption } from "optolith-database-schema/gen"
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
  switch (displayOption.kind) {
    case "Hide":
      return undefined
    case "ReplaceWith":
      return {
        value:
          locale.translateMap(displayOption.ReplaceWith.translations)
            ?.replacement ?? MISSING_VALUE,
        sentenceType: displayOption.ReplaceWith.sentence_type,
        isMeta: false,
      }
    default:
      return assertExhaustive(displayOption)
  }
}
