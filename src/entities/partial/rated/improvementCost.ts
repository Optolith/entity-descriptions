import { rangeSize, type RangeBounds } from "@elyukai/utils/range"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type { ImprovementCost } from "optolith-database-schema/gen"
import { type RawDefinitionListEntityDescriptionSectionItem } from "../../../index.js"
import { translateR, type StdReader } from "../reader.js"

/**
 * Renders an improvement cost value as a string.
 */
export const renderImprovementCostValue = (
  improvementCost: ImprovementCost,
): string => improvementCost.kind

/**
 * Returns the improvement cost as an inline library property.
 */
export const renderImprovementCost = (
  improvementCost: ImprovementCost,
): StdReader<RawDefinitionListEntityDescriptionSectionItem, "t"> =>
  translateR("Improvement Cost").map(label => ({
    label,
    value: renderImprovementCostValue(improvementCost),
  }))

/**
 * Calculates the adventure points for an improvement cost.
 * @throws {RangeError} if the rating range is invalid (max < min).
 */
export const calculateAdventurePointsFromImprovementCost = (
  improvementCost:
    | ImprovementCost
    | ImprovementCost["kind"]
    | { kind: "E" }
    | "E",
  rating: number | RangeBounds = 1,
): number => {
  const normalized =
    typeof improvementCost === "string" ? improvementCost : improvementCost.kind

  const base = (() => {
    switch (normalized) {
      case "A":
        return 1
      case "B":
        return 2
      case "C":
        return 3
      case "D":
        return 4
      case "E":
        return 15
      default:
        return assertExhaustive(normalized)
    }
  })()

  const lastRatingOfSameValue = (() => {
    switch (normalized) {
      case "A":
      case "B":
      case "C":
      case "D":
        return 12
      case "E":
        return 14
      default:
        return assertExhaustive(normalized)
    }
  })()

  if (typeof rating === "number") {
    return (
      base *
      (rating < lastRatingOfSameValue ? 1 : rating - lastRatingOfSameValue + 1)
    )
  } else {
    const [min, max] = rating

    if (max < min) {
      throw new RangeError(`Invalid rating range: ${min} - ${max}`)
    }

    const size = rangeSize(rating)
    const constantRangeSize = Math.min(size, lastRatingOfSameValue - min + 1)
    const variableRangeSize = size - constantRangeSize

    const constantCost = base * constantRangeSize
    const variableCost =
      base * (((variableRangeSize + 1) * (variableRangeSize + 2)) / 2 - 1)

    return constantCost + variableCost
  }
}
