import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { describe, it } from "node:test"
import { printStatePrerequisite } from "../../../../../src/entities/partial/prerequisites/single/state.js"
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

    assert.deepEqual(
      printStatePrerequisite(getInstanceById, defaultLocaleEnvironment, {
        id: ExampleUUID,
      }),
      {
        label: "State ",
        value: `^[A](context: "prerequisite", entity: "State", instance: "${ExampleUUID}")`,
        sentenceType: undefined,
        isMeta: false,
      },
    )

    assert.deepEqual(
      printStatePrerequisite(
        () => ({
          id: ExampleUUID,
          src: [],
          translations: {},
        }),
        defaultLocaleEnvironment,
        {
          id: ExampleUUID,
        },
      ),
      undefined,
    )

    assert.deepEqual(
      printStatePrerequisite(getInstanceById, defaultLocaleEnvironment, {
        id: ExampleUUID,
        display_option: Case("ReplaceWith", {
          translations: {
            "en-US": { replacement: "Replacement" },
          },
        }),
      }),
      {
        value: "Replacement",
        sentenceType: undefined,
        isMeta: false,
      },
    )
  })
})
