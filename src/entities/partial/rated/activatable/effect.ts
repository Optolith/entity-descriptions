import { filterNonNullable } from "@optolith/helpers/array"
import { mapNullable } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type { ActivatableSkillEffect } from "optolith-database-schema/gen"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { EntityDescriptionSection } from "../../../../index.js"

const getContentPartsForQualityLevels = (
  getQualityLevelString: (index: number) => string | number,
  locale: LocaleEnvironment,
  source: {
    text_before: string
    quality_levels: string[]
    text_after?: string
  },
): EntityDescriptionSection[] =>
  filterNonNullable([
    {
      label: locale.translate("Effect"),
      value: source.text_before,
    },
    ...source.quality_levels.map((text, index) => ({
      value: text,
      label: locale.translate("QL {$value}", {
        value: getQualityLevelString(index),
      }),
    })),
    mapNullable(source.text_after, textAfter => ({
      value: textAfter,
      className: "effect-after",
    })),
  ])

/**
 * Gets the text for the effect of an activatable skill.
 */
export const getTextForEffect = (
  locale: LocaleEnvironment,
  effect: ActivatableSkillEffect,
): EntityDescriptionSection[] => {
  switch (effect.kind) {
    case "Plain":
      return [
        {
          label: locale.translate("Effect"),
          value: effect.Plain.text,
        },
      ]
    case "ForEachQualityLevel":
      return getContentPartsForQualityLevels(
        index => index + 1,
        locale,
        effect.ForEachQualityLevel,
      )
    case "ForEachTwoQualityLevels":
      return getContentPartsForQualityLevels(
        index => `${index * 2 + 1}–${index * 2 + 2}`,
        locale,
        effect.ForEachTwoQualityLevels,
      )
    default:
      return assertExhaustive(effect)
  }
}
