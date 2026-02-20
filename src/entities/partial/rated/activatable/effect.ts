import { filterNonNullable } from "@optolith/helpers/array"
import { mapNullable } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type { ActivatableSkillEffect } from "optolith-database-schema/gen"
import { EntityDescriptionSection } from "../../../../index.js"
import { translateFnR, type StdReader } from "../../reader.js"

const getContentPartsForQualityLevels = (
  getQualityLevelString: (index: number) => string | number,
  source: {
    text_before: string
    quality_levels: string[]
    text_after?: string
  },
): StdReader<EntityDescriptionSection[], "t"> =>
  translateFnR.map(translate =>
    filterNonNullable([
      {
        label: translate("Effect"),
        value: source.text_before,
      },
      ...source.quality_levels.map((text, index) => ({
        value: text,
        label: translate("QL {$value}", {
          value: getQualityLevelString(index),
        }),
      })),
      mapNullable(source.text_after, textAfter => ({
        value: textAfter,
        className: "effect-after",
      })),
    ]),
  )

/**
 * Gets the text for the effect of an activatable skill.
 */
export const renderEffect = (
  effect: ActivatableSkillEffect,
): StdReader<EntityDescriptionSection[], "t"> => {
  switch (effect.kind) {
    case "Plain":
      return translateFnR.map(translate => [
        {
          label: translate("Effect"),
          value: effect.Plain.text,
        },
      ])
    case "ForEachQualityLevel":
      return getContentPartsForQualityLevels(
        index => index + 1,
        effect.ForEachQualityLevel,
      )
    case "ForEachTwoQualityLevels":
      return getContentPartsForQualityLevels(
        index => `${index * 2 + 1}–${index * 2 + 2}`,
        effect.ForEachTwoQualityLevels,
      )
    default:
      return assertExhaustive(effect)
  }
}
