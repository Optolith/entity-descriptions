import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { describe, it } from "node:test"
import { printStatePrerequisite } from "../../../../../src/entities/partial/prerequisites/single/state.js"
import { MISSING_VALUE } from "../../../../../src/entities/partial/unknown.js"
import { Case } from "../../../../../src/helpers/enums.js"
import type { GetInstanceById } from "../../../../../src/helpers/getTypes.js"
import { defaultLocaleEnvironment } from "../../../../helpers/locale.js"

const ExampleUUID = randomUUID()

describe("getStatePrerequisiteTranslation", () => {
  it("returns a PrerequisitePart object for the prerequisite", () => {
    const getInstanceById: GetInstanceById<"State"> = () => ({
      id: ExampleUUID,
      src: [],
      translations: {
        "en-US": {
          name: "A",
          description: "Description",
        },
      },
    })

    const env = { ...defaultLocaleEnvironment, getInstanceById }

    assert.deepEqual(
      printStatePrerequisite({
        id: ExampleUUID,
      }).run(env),
      {
        label: "State ",
        value: `^[A](context: "prerequisite", entity: "State", instance: "${ExampleUUID}")`,
        sentenceType: undefined,
        isMeta: false,
      },
    )

    assert.deepEqual(
      printStatePrerequisite({
        id: ExampleUUID,
      }).run({
        ...defaultLocaleEnvironment,
        getInstanceById: () => ({
          id: ExampleUUID,
          src: [],
          translations: {},
        }),
      }),
      {
        isMeta: false,
        label: "State ",
        sentenceType: undefined,
        value: MISSING_VALUE,
      },
    )

    assert.deepEqual(
      printStatePrerequisite({
        id: ExampleUUID,
        display_option: Case("ReplaceWith", {
          translations: {
            "en-US": { replacement: "Replacement" },
          },
        }),
      }).run({ ...defaultLocaleEnvironment, getInstanceById }),
      {
        value: "Replacement",
        sentenceType: undefined,
        isMeta: false,
      },
    )
  })
})
