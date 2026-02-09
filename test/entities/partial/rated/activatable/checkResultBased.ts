import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { getCheckResultBasedValueTranslation } from "../../../../../src/entities/partial/rated/activatable/checkResultBased.js"
import { Case } from "../../../../../src/helpers/enums.js"
import { translateMock } from "../../../../helpers/translate.js"

describe("getTextForCheckResultBased", () => {
  it("should return the value text for a check-result-based parameter of an activatable skill", () => {
    assert.equal(
      getCheckResultBasedValueTranslation(translateMock, {
        base: Case("QualityLevels"),
      }),
      "QL",
    )
    assert.equal(
      getCheckResultBasedValueTranslation(translateMock, {
        base: Case("SkillPoints"),
      }),
      "SP",
    )
    assert.equal(
      getCheckResultBasedValueTranslation(translateMock, {
        base: Case("QualityLevels"),
        modifier: { arithmetic: Case("Divide"), value: 2 },
      }),
      "QL / 2",
    )
    assert.equal(
      getCheckResultBasedValueTranslation(translateMock, {
        base: Case("SkillPoints"),
        modifier: { arithmetic: Case("Multiply"), value: 3 },
      }),
      "SP × 3",
    )
  })
})
