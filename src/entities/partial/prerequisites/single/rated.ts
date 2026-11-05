import { Reader } from "@elyukai/utils/reader"
import type { RatedPrerequisite } from "@optolith/database-schema/gen"
import type { StdReader } from "../../../../env.js"
import { attributedCustomNameR } from "../../reader.js"
import { MISSING_VALUE } from "../../unknown.js"
import { printDisplayOption } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a blessed tradition prerequisite.
 */
export const printRatedPrerequisite = (
  prerequisite: RatedPrerequisite,
): StdReader<
  PrerequisitePart,
  "t" | "tm" | "ibi",
  | "Attribute"
  | "Skill"
  | "CloseCombatTechnique"
  | "RangedCombatTechnique"
  | "Spell"
  | "Ritual"
  | "LiturgicalChant"
  | "Ceremony"
> =>
  printDisplayOption(prerequisite.display_option).thenW(displayOption =>
    displayOption !== undefined
      ? Reader.of(displayOption)
      : attributedCustomNameR(
          "prerequisite",
          (t: { name: string; abbreviation?: string }) => t.abbreviation ?? t.name,
          prerequisite.id,
        )
          .map(name => name ?? MISSING_VALUE)
          .map((name): PrerequisitePart => ({
            value: prerequisite.value > 0 ? `${name} ${prerequisite.value.toFixed()}` : name,
            sentenceType: undefined,
            isMeta: false,
          })),
  )
