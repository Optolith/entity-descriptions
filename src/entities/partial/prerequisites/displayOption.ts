import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type { DisplayOption } from "optolith-database-schema/gen"
import type { TranslateMap } from "../../../helpers/translate.js"
import { MISSING_VALUE } from "../unknown.js"
import type { PrerequisitePart } from "./part.js"

/**
 * Get the translation of a display option.
 */
export const printDisplayOption = (
  translateMap: TranslateMap,
  displayOption: DisplayOption,
): PrerequisitePart | undefined => {
  switch (displayOption.kind) {
    case "Hide":
      return undefined
    case "ReplaceWith":
      return {
        value: translateMap(displayOption.ReplaceWith.translations)?.replacement ?? MISSING_VALUE,
        sentenceType: displayOption.ReplaceWith.sentence_type,
        isMeta: false,
      }
    default:
      return assertExhaustive(displayOption)
  }
}
