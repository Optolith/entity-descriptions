import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { renderCheckResultBasedValue } from "../../../../../src/entities/partial/rated/activatable/checkResultBased.js"
import { Case } from "../../../../../src/helpers/enums.js"
import { translateMock } from "../../../../helpers/translate.js"

describe("getTextForCheckResultBased", () => {
  it("should return the value text for a check-result-based parameter of an activatable skill", () => {
    assert.equal(
      renderCheckResultBasedValue({
        base: Case("QualityLevels"),
      }).run({ translate: translateMock }),
      "QL",
    )
    assert.equal(
      renderCheckResultBasedValue({
        base: Case("SkillPoints"),
      }).run({ translate: translateMock }),
      "SP",
    )
    assert.equal(
      renderCheckResultBasedValue({
        base: Case("QualityLevels"),
        modifier: { arithmetic: Case("Divide"), value: 2 },
      }).run({ translate: translateMock }),
      "QL / 2",
    )
    assert.equal(
      renderCheckResultBasedValue({
        base: Case("SkillPoints"),
        modifier: { arithmetic: Case("Multiply"), value: 3 },
      }).run({ translate: translateMock }),
      "SP × 3",
    )
  })
})
