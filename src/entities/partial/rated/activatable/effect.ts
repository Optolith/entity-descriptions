import { filterNonNullable } from "@optolith/helpers/array"
import { mapNullable } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import { Effect } from "optolith-database-schema/types/_ActivatableSkillEffect"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { LibraryEntryContent } from "../../../../libraryEntry.js"

const getContentPartsForQualityLevels = (
  getQualityLevelString: (index: number) => string | number,
  locale: LocaleEnvironment,
  source: {
    text_before: string
    quality_levels: string[]
    text_after?: string
  }
): LibraryEntryContent[] =>
  filterNonNullable([
    {
      label: locale.translate("Effect"),
      value: source.text_before,
    },
    ...source.quality_levels.map((text, index) => ({
      value: text,
      label: locale.translate("QL {0}", getQualityLevelString(index)),
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
  locale: LocaleEnvironment,
  effect: Effect
): LibraryEntryContent[] => {
  switch (effect.tag) {
    case "Plain":
      return [
        {
          label: locale.translate("Effect"),
          value: effect.plain.text,
        },
      ]
    case "ForEachQualityLevel":
      return getContentPartsForQualityLevels(
        (index) => index + 1,
        locale,
        effect.for_each_quality_level
      )
    case "ForEachTwoQualityLevels":
      return getContentPartsForQualityLevels(
        (index) => `${index * 2 + 1}–${index * 2 + 2}`,
        locale,
        effect.for_each_two_quality_levels
      )
    default:
      return assertExhaustive(effect)
  }
}
