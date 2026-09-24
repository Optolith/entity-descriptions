import { Reader } from "@elyukai/utils/reader"
import type { RatedSumPrerequisite } from "@optolith/database-schema/gen"
import { isNotNullish } from "@optolith/helpers/nullable"
import type { StdReader } from "../../../../env.js"
import { attributedNameR, localeJoinR, localeSortR, translateR } from "../../reader.js"
import { printDisplayOption } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a rated sum prerequisite.
 */
export const printRatedSumPrerequisite = (
  prerequisite: RatedSumPrerequisite,
): StdReader<PrerequisitePart | undefined, "t" | "tm" | "lc" | "lj" | "ibi", "Skill"> =>
  prerequisite.display_option !== undefined
    ? printDisplayOption(prerequisite.display_option)
    : Reader.traverse(prerequisite.targets, id => attributedNameR("prerequisite", "Skill", id))
        .map(skills => skills.filter(isNotNullish))
        .thenW(localeSortR)
        .thenW(skills => localeJoinR(skills, "conjunction"))
        .thenW(skills =>
          translateR("the SR for {$skill} combined must add up to at least {$minRating}", {
            skill: skills,
            minRating: prerequisite.sum.toFixed(),
          }),
        )
        .map(value => ({
          value,
          sentenceType: undefined,
          isMeta: false,
        }))
