import type { ImprovementCost } from "optolith-database-schema/gen"
import { type RawDefinitionListEntityDescriptionSectionItem } from "../../../index.js"
import { translateR, type StdReader } from "../reader.js"

/**
 * Returns the improvement cost as an inline library property.
 */
export const renderImprovementCost = (
  improvementCost: ImprovementCost,
): StdReader<RawDefinitionListEntityDescriptionSectionItem, "t"> =>
  translateR("Improvement Cost").map(label => ({
    label,
    value: improvementCost.kind,
  }))
