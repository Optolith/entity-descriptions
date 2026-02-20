import type { ImprovementCost } from "optolith-database-schema/gen"
import { EntityDescriptionSection } from "../../../index.js"
import { translateR, type StdReader } from "../reader.js"

/**
 * Returns the improvement cost as an inline library property.
 */
export const renderImprovementCost = (
  improvementCost: ImprovementCost,
): StdReader<EntityDescriptionSection, "t"> =>
  translateR("Improvement Cost").map(label => ({
    label,
    value: improvementCost.kind,
  }))
