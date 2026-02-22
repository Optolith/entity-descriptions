import { equal, throws } from "node:assert/strict"
import { describe, it } from "node:test"
import { calculateAdventurePointsFromImprovementCost } from "../../../../src/entities/partial/rated/improvementCost.js"

describe("calculateAdventurePointsFromImprovementCost", () => {
  it("calculates the correct adventure points for a single rating", () => {
    equal(calculateAdventurePointsFromImprovementCost("A", 1), 1)
    equal(calculateAdventurePointsFromImprovementCost("A", 12), 1)
    equal(calculateAdventurePointsFromImprovementCost("A", 13), 2)
    equal(calculateAdventurePointsFromImprovementCost("A", 14), 3)
    equal(calculateAdventurePointsFromImprovementCost("A", 15), 4)
    equal(calculateAdventurePointsFromImprovementCost("D", 1), 4)
    equal(calculateAdventurePointsFromImprovementCost("D", 12), 4)
    equal(calculateAdventurePointsFromImprovementCost("D", 13), 8)
    equal(calculateAdventurePointsFromImprovementCost("D", 14), 12)
    equal(calculateAdventurePointsFromImprovementCost("D", 15), 16)
    equal(calculateAdventurePointsFromImprovementCost("E", 1), 15)
    equal(calculateAdventurePointsFromImprovementCost("E", 12), 15)
    equal(calculateAdventurePointsFromImprovementCost("E", 13), 15)
    equal(calculateAdventurePointsFromImprovementCost("E", 14), 15)
    equal(calculateAdventurePointsFromImprovementCost("E", 15), 30)
    equal(calculateAdventurePointsFromImprovementCost("E", 16), 45)
  })

  it("calculates the correct adventure points for a rating range", () => {
    equal(calculateAdventurePointsFromImprovementCost("A", [1, 1]), 1)
    equal(calculateAdventurePointsFromImprovementCost("A", [1, 12]), 12)
    equal(calculateAdventurePointsFromImprovementCost("A", [1, 13]), 14)
    equal(calculateAdventurePointsFromImprovementCost("A", [1, 14]), 17)
    equal(calculateAdventurePointsFromImprovementCost("A", [1, 15]), 21)
    equal(calculateAdventurePointsFromImprovementCost("D", [1, 15]), 84)
    equal(calculateAdventurePointsFromImprovementCost("E", [1, 16]), 285)
  })

  it("throws a RangeError for an invalid rating range", () => {
    throws(() => calculateAdventurePointsFromImprovementCost("A", [13, 12]), {
      name: "RangeError",
      message: "Invalid rating range: 13 - 12",
    })
  })
})
