import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { printStatePrerequisite } from "../../../../../src/entities/partial/prerequisites/single/state.js"
import { GetById } from "../../../../../src/helpers/getTypes.js"
import { defaultLocaleEnvironment } from "../../../../helpers/locale.js"

describe("getStatePrerequisiteTranslation", () => {
  it("returns a PrerequisitePart object for the prerequisite", () => {
    const getStateById: GetById.Static.State = () => ({
      id: 1,
      src: [],
      translations: {
        "en-US": {
          name: "A",
          description: "Description",
        },
      },
    })

    assert.deepEqual(
      printStatePrerequisite(getStateById, defaultLocaleEnvironment, {
        id: {
          tag: "State",
          state: 1,
        },
      }),
      {
        label: "State ",
        value: "*A*",
        sentenceType: undefined,
        isMeta: false,
      },
    )

    assert.deepEqual(
      printStatePrerequisite(
        () => ({
          id: 1,
          src: [],
          translations: {},
        }),
        defaultLocaleEnvironment,
        {
          id: {
            tag: "State",
            state: 1,
          },
        },
      ),
      undefined,
    )

    assert.deepEqual(
      printStatePrerequisite(getStateById, defaultLocaleEnvironment, {
        id: {
          tag: "State",
          state: 1,
        },
        display_option: {
          tag: "ReplaceWith",
          replace_with: {
            translations: {
              "en-US": "Replacement",
            },
          },
        },
      }),
      {
        value: "Replacement",
        sentenceType: undefined,
        isMeta: false,
      },
    )
  })
})
