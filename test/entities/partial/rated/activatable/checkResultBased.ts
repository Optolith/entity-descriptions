import type { ExpressionBasedParameterValue } from "@optolith/database-schema/gen"
import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { renderExpressionBasedParameterValue } from "../../../../../src/entities/partial/rated/activatable/checkResultBased.js"
import { Case } from "../../../../../src/helpers/enums.js"
import { translateMock } from "../../../../helpers/translate.js"

describe("getTextForCheckResultBased", () => {
  it("should return the value text for a check-result-based parameter of an activatable skill", () => {
    assert.equal(
      renderExpressionBasedParameterValue(Case("Value", Case("QualityLevels"))).run({
        translate: translateMock,
      }),
      "QL",
    )
    assert.equal(
      renderExpressionBasedParameterValue(Case("Value", Case("SkillPoints"))).run({
        translate: translateMock,
      }),
      "SP",
    )
    assert.equal(
      renderExpressionBasedParameterValue(
        Case("Division", [
          Case("Value", Case("QualityLevels")),
          Case("Value", Case("Constant", 2)),
        ] as [ExpressionBasedParameterValue, ExpressionBasedParameterValue]),
      ).run({ translate: translateMock }),
      "QL / 2",
    )
    assert.equal(
      renderExpressionBasedParameterValue(
        Case("Multiplication", [
          Case("Value", Case("SkillPoints")),
          Case("Value", Case("Constant", 3)),
        ] as [ExpressionBasedParameterValue, ExpressionBasedParameterValue]),
      ).run({ translate: translateMock }),
      "SP × 3",
    )
  })
})
