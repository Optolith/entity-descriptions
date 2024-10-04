import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { translateMock } from "../../../../helpers/translate.js"
import { getTextForCheckResultBased } from "./checkResultBased.js"

describe("getTextForCheckResultBased", () => {
  it("should return the value text for a check-result-based parameter of an activatable skill", () => {
    assert.equal(
      getTextForCheckResultBased({ base: "QualityLevels" }, translateMock),
      "QL"
    )
    assert.equal(
      getTextForCheckResultBased({ base: "SkillPoints" }, translateMock),
      "SP"
    )
    assert.equal(
      getTextForCheckResultBased(
        { base: "QualityLevels", modifier: { arithmetic: "Divide", value: 2 } },
        translateMock
      ),
      "QL / 2"
    )
    assert.equal(
      getTextForCheckResultBased(
        { base: "SkillPoints", modifier: { arithmetic: "Multiply", value: 3 } },
        translateMock
      ),
      "SP × 3"
    )
  })
})
