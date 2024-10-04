import { ImprovementCost as RawImprovementCost } from "optolith-database-schema/types/_ImprovementCost"
import { Translate } from "../../../helpers/translate.js"
import { LibraryEntryContent } from "../../../libraryEntry.js"

/**
 * Returns the improvement cost as an inline library property.
 */
export const createImprovementCost = (
  translate: Translate,
  improvementCost: RawImprovementCost
): LibraryEntryContent => ({
  label: translate("Improvement Cost"),
  value: improvementCost,
})
