import { filterNonNullable } from "@optolith/helpers/array"
import { mapNullable } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import { Effect } from "optolith-database-schema/types/_ActivatableSkillEffect"
import { Translate } from "../../../../helpers/translate.js"
import { LibraryEntryContent } from "../../../../libraryEntry.js"

const getContentPartsForQualityLevels = (
  source: {
    text_before: string
    quality_levels: string[]
    text_after?: string
  },
  getQualityLevelString: (index: number) => string | number,
  translate: Translate
): LibraryEntryContent[] =>
  filterNonNullable([
    {
      label: translate("Effect"),
      value: source.text_before,
    },
    ...source.quality_levels.map((text, index) => ({
      value: text,
      label: translate("QL {0}", getQualityLevelString(index)),
    })),
    mapNullable(source.text_after, (textAfter) => ({
      value: textAfter,
      className: "effect-after",
    })),
  ])

/**
 * Gets the text for the effect of an activatable skill.
 */
export const getTextForEffect = (
  effect: Effect,
  translate: Translate
): LibraryEntryContent[] => {
  switch (effect.tag) {
    case "Plain":
      return [
        {
          label: translate("Effect"),
          value: effect.plain.text,
        },
      ]
    case "ForEachQualityLevel":
      return getContentPartsForQualityLevels(
        effect.for_each_quality_level,
        (index) => index + 1,
        translate
      )
    case "ForEachTwoQualityLevels":
      return getContentPartsForQualityLevels(
        effect.for_each_two_quality_levels,
        (index) => `${index * 2 + 1}–${index * 2 + 2}`,
        translate
      )
    default:
      return assertExhaustive(effect)
  }
}
