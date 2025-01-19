import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  joinPrerequisiteParts,
  PrerequisitePart,
} from "../../../../src/entities/partial/prerequisites/part.js"
import { defaultLocaleEnvironment } from "../../../helpers/locale.js"

describe("joinPrerequisiteParts", () => {
  it("should join normal parts by comma", () => {
    const parts: PrerequisitePart[] = [
      { value: "A", sentenceType: undefined, isMeta: false },
      {
        label: "Label for ",
        value: "B",
        sentenceType: undefined,
        isMeta: false,
      },
      { value: "C", sentenceType: undefined, isMeta: false },
    ]
    const result = joinPrerequisiteParts(defaultLocaleEnvironment, parts)
    assert.equal(result, "A, Label for B, C")
  })

  it("should connect connected sentence types by semicolon", () => {
    const parts: PrerequisitePart[] = [
      { value: "A", sentenceType: undefined, isMeta: false },
      { value: "B", sentenceType: "Connected", isMeta: false },
      { value: "C", sentenceType: "Connected", isMeta: false },
      { value: "D", sentenceType: undefined, isMeta: false },
      { value: "E", sentenceType: undefined, isMeta: false },
      { value: "F", sentenceType: "Connected", isMeta: false },
    ]
    const result = joinPrerequisiteParts(defaultLocaleEnvironment, parts)
    assert.equal(result, "A; B; C; D, E; F")
  })

  it("should connect standalone sentence types by periods", () => {
    const parts: PrerequisitePart[] = [
      { value: "A", sentenceType: undefined, isMeta: false },
      { value: "B", sentenceType: "Standalone", isMeta: false },
      { value: "C", sentenceType: "Standalone", isMeta: false },
      { value: "D", sentenceType: undefined, isMeta: false },
      { value: "E", sentenceType: undefined, isMeta: false },
      { value: "F.", sentenceType: "Standalone", isMeta: false },
      { value: "G.", sentenceType: "Standalone", isMeta: false },
      { value: "H", sentenceType: undefined, isMeta: false },
      { value: "I", sentenceType: undefined, isMeta: false },
      { value: "J", sentenceType: "Standalone", isMeta: false },
    ]
    const result = joinPrerequisiteParts(defaultLocaleEnvironment, parts)
    assert.equal(result, "A. B. C. D, E. F. G. H, I. J.")
  })

  it("adds “none” at the beginning if all parts are declared as meta prerequisites", () => {
    const parts: PrerequisitePart[] = [
      { value: "A", sentenceType: undefined, isMeta: true },
      { value: "B", sentenceType: undefined, isMeta: true },
      { value: "C", sentenceType: undefined, isMeta: true },
    ]
    const result = joinPrerequisiteParts(defaultLocaleEnvironment, parts)
    assert.equal(result, "none, A, B, C")
  })

  it("throws an error if the sentenceType is unknown", () => {
    const parts: PrerequisitePart[] = [
      // @ts-expect-error Testing invalid input
      { value: "A", sentenceType: "any", isMeta: true },
    ]
    const block = () => joinPrerequisiteParts(defaultLocaleEnvironment, parts)
    assert.throws(block)
  })
})
