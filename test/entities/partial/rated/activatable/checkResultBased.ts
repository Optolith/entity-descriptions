import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { getCheckResultBasedValueTranslation } from "../../../../../src/entities/partial/rated/activatable/checkResultBased.js"
import { translateMock } from "../../../../../src/helpers/translate.js"

describe("getTextForCheckResultBased", () => {
  it("should return the value text for a check-result-based parameter of an activatable skill", () => {
    assert.equal(
      getCheckResultBasedValueTranslation(translateMock, {
        base: "QualityLevels",
      }),
      "QL"
    )
    assert.equal(
      getCheckResultBasedValueTranslation(translateMock, {
        base: "SkillPoints",
      }),
      "SP"
    )
    assert.equal(
      getCheckResultBasedValueTranslation(translateMock, {
        base: "QualityLevels",
        modifier: { arithmetic: "Divide", value: 2 },
      }),
      "QL / 2"
    )
    assert.equal(
      getCheckResultBasedValueTranslation(translateMock, {
        base: "SkillPoints",
        modifier: { arithmetic: "Multiply", value: 3 },
      }),
      "SP × 3"
    )
  })
})
