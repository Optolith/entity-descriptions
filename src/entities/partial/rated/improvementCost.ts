import type { ImprovementCost } from "optolith-database-schema/gen"
import { Translate } from "../../../helpers/translate.js"
import { EntityDescriptionSection } from "../../../index.js"

/**
 * Returns the improvement cost as an inline library property.
 */
export const createImprovementCost = (
  translate: Translate,
  improvementCost: ImprovementCost,
): EntityDescriptionSection => ({
  label: translate("Improvement Cost"),
  value: improvementCost.kind,
})
