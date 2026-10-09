import { isNotNullish } from "@elyukai/utils/nullable"
import { romanize } from "@elyukai/utils/roman"
import type { AnimistPowerPrerequisite } from "@optolith/database-schema/gen"
import type { StdReader } from "../../../../env.js"
import { attributedNameR } from "../../reader.js"
import { printDisplayOption } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a culture prerequisite.
 */
export const printAnimistPowerPrerequisite = (
  prerequisite: AnimistPowerPrerequisite,
): StdReader<PrerequisitePart | undefined, "tm" | "ibi", "AnimistPower"> =>
  prerequisite.display_option !== undefined
    ? printDisplayOption(prerequisite.display_option)
    : attributedNameR("prerequisite", "AnimistPower", prerequisite.id).map(name => ({
        value: [
          name ?? "MISSING_VALUE",
          prerequisite.level === undefined ? undefined : romanize(prerequisite.level),
          prerequisite.value.toFixed(),
        ]
          .filter(isNotNullish)
          .join(" "),
        sentenceType: undefined,
        isMeta: false,
      }))
