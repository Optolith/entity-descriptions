import { Reader } from "@elyukai/utils/reader"
import type {
  EnhancementPrerequisite,
  SkillWithEnhancementsIdentifier,
} from "@optolith/database-schema/gen"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import { fromUniformCase } from "tsondb/schema/gen"
import {
  attributedNameFromInstanceR,
  getInstanceByIdR,
  translateR,
  type StdEnv,
  type StdReader,
} from "../../reader.js"
import { MISSING_VALUE } from "../../unknown.js"
import type { PrerequisitePart } from "../part.js"

const printLabel = (skillId: SkillWithEnhancementsIdentifier): StdReader<string, "t"> => {
  switch (skillId.kind) {
    case "Spell":
    case "Ritual":
      return translateR("spell enhancement")
    case "LiturgicalChant":
    case "Ceremony":
      return translateR("liturgical enhancement")
    default:
      return assertExhaustive(skillId)
  }
}

type EnvExtra = {
  hideParent?: true
}

/**
 * Get the translation of an external enhancement prerequisite.
 */
export const printEnhancementPrerequisite = (
  prerequisite: EnhancementPrerequisite,
): Reader<
  StdEnv<"t" | "tm" | "ibi", "Enhancement" | "Spell" | "Ritual" | "LiturgicalChant" | "Ceremony"> &
    EnvExtra,
  PrerequisitePart | undefined
> =>
  getInstanceByIdR("Enhancement", prerequisite.id).thenW(enhancement =>
    enhancement === undefined
      ? Reader.of(undefined)
      : getInstanceByIdR(enhancement.parent).thenW(skill =>
          printLabel(enhancement.parent).thenW(label =>
            Reader.asks((env: EnvExtra) => env.hideParent ?? false).thenW(hideParent =>
              attributedNameFromInstanceR(
                enhancement,
                "prerequisite",
                "Enhancement",
                prerequisite.id,
              )
                .map(name => name ?? MISSING_VALUE)
                .thenW(name =>
                  hideParent
                    ? Reader.of(name)
                    : attributedNameFromInstanceR(
                        skill,
                        "prerequisite",
                        enhancement.parent.kind,
                        fromUniformCase(enhancement.parent),
                      )
                        .map(skillName => skillName ?? MISSING_VALUE)
                        .thenW(skillName =>
                          translateR("for").map(forText => `${name} ${forText} ${skillName}`),
                        ),
                )
                .map(
                  (value): PrerequisitePart => ({
                    label: `${label} `,
                    value,
                    sentenceType: undefined,
                    isMeta: false,
                  }),
                ),
            ),
          ),
        ),
  )
