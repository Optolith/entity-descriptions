import { mapNullable } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type { ActivatableSkillEffect } from "optolith-database-schema/gen"
import type { RawDefinitionListEntityDescriptionSectionItem } from "../../../../index.js"
import { translateFnR, type StdReader } from "../../reader.js"

const getContentPartsForQualityLevels = (
  getQualityLevelString: (index: number) => string | number,
  source: {
    text_before: string
    quality_levels: string[]
    text_after?: string
  },
): StdReader<RawDefinitionListEntityDescriptionSectionItem, "t"> =>
  translateFnR.map(
    (translate): RawDefinitionListEntityDescriptionSectionItem => ({
      label: translate("Effect"),
      value: [
        {
          type: "plain",
          text: source.text_before,
        },
        {
          type: "definitionList",
          items: source.quality_levels.map((text, index) => ({
            label: translate("QL {$value}", {
              value: getQualityLevelString(index),
            }),
            value: text,
          })),
        },
        mapNullable(source.text_after, textAfter => ({
          type: "plain",
          text: textAfter,
        })),
      ],
    }),
  )

/**
 * Gets the text for the effect of an activatable skill.
 */
export const renderEffect = (
  effect: ActivatableSkillEffect,
): StdReader<RawDefinitionListEntityDescriptionSectionItem, "t"> => {
  switch (effect.kind) {
    case "Plain":
      return translateFnR.map(translate => ({
        label: translate("Effect"),
        value: effect.Plain.text,
      }))
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
