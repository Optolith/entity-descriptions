import assert from "node:assert/strict"
import { describe, it } from "node:test"
import type { MathOperation } from "optolith-database-schema/gen"
import { Case } from "tsondb/schema/gen"
import { renderMathOperation } from "../../../src/entities/partial/mathOperation.js"

describe("renderMathOperation", () => {
  it("renders a simple value", () => {
    const operation: MathOperation<number> = Case("Value", 5)
    const result = renderMathOperation(operation, String)
    assert.equal(result, "5")
  })

  it("renders a binary operation", () => {
    const operation: MathOperation<number> = Case<
      "Addition",
      [MathOperation<number>, MathOperation<number>]
    >("Addition", [Case("Value", 2), Case("Value", 3)])
    const result = renderMathOperation(operation, String)
    assert.equal(result, "2 + 3")
  })

  it("renders a nested operation", () => {
    const operation: MathOperation<number> = Case<
      "Multiplication",
      [MathOperation<number>, MathOperation<number>]
    >("Multiplication", [
      Case<"Addition", [MathOperation<number>, MathOperation<number>]>(
        "Addition",
        [Case("Value", 1), Case("Value", 2)],
      ),
      Case("Value", 3),
    ])
    const result = renderMathOperation(operation, String)
    assert.equal(result, "(1 + 2) × 3")
  })
})
