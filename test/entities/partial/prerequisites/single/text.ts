import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { printTextPrerequisite } from "../../../../../src/entities/partial/prerequisites/single/text.js"
import { MISSING_VALUE } from "../../../../../src/entities/partial/unknown.js"
import { defaultLocaleEnvironment } from "../../../../helpers/locale.js"

describe("getTextPrerequisiteTranslation", () => {
  it("returns a PrerequisitePart object for the prerequisite", () => {
    assert.deepEqual(
      printTextPrerequisite(defaultLocaleEnvironment, {
        verification: "Pass",
        sentence_type: undefined,
        translations: {
          "en-US": "A",
        },
      }),
      {
        value: "A",
        sentenceType: undefined,
        isMeta: false,
      },
    )

    assert.deepEqual(
      printTextPrerequisite(defaultLocaleEnvironment, {
        verification: "Pass",
        sentence_type: "Standalone",
        is_meta: true,
        translations: {},
      }),
      {
        value: MISSING_VALUE,
        sentenceType: "Standalone",
        isMeta: true,
      },
    )
  })
})
