import { Reader } from "@elyukai/utils/reader"
import type { PersonalityTraitPrerequisite } from "@optolith/database-schema/gen"
import type { StdReader } from "../../../../env.js"
import { attributedNameFromInstanceR, getInstanceByIdR, translateR } from "../../reader.js"
import { MISSING_VALUE } from "../../unknown.js"
import { printDisplayOption } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a personality trait prerequisite.
 */
export const printPersonalityTraitPrerequisite = (
  prerequisite: PersonalityTraitPrerequisite,
): StdReader<PrerequisitePart | undefined, "t" | "tm" | "ibi", "PersonalityTrait"> =>
  prerequisite.display_option !== undefined
    ? printDisplayOption(prerequisite.display_option)
    : getInstanceByIdR("PersonalityTrait", prerequisite.id).thenW(personalityTrait =>
        personalityTrait === undefined
          ? Reader.of(undefined)
          : attributedNameFromInstanceR(
              personalityTrait,
              "prerequisite",
              "PersonalityTrait",
              prerequisite.id,
            )
              .map(name => name ?? MISSING_VALUE)
              .thenW(name =>
                translateR("Level {$level}", {
                  level: personalityTrait.level,
                }).map(level => `${name} (${level})`),
              )
              .then(name =>
                prerequisite.active
                  ? translateR("must have {$trait}", {
                      trait: name,
                    })
                  : translateR("cannot be chosen at the same time as {$trait}", {
                      trait: name,
                    }),
              )
              .map(value => ({
                value,
                sentenceType: undefined,
                isMeta: false,
              })),
      )
