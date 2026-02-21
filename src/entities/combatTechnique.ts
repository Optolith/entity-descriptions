import { mapNullable } from "@optolith/helpers/nullable"
import { createEntityDescriptionCreator } from "../creator.js"
import type { GetInstanceById } from "../helpers/getTypes.js"
import { renderImprovementCost } from "./partial/rated/improvementCost.js"

/**
 * Get a JSON representation of the rules text for a close combat technique.
 */
export const getCloseCombatTechniqueEntityDescription =
  createEntityDescriptionCreator<
    "CloseCombatTechnique",
    {
      getInstanceById: GetInstanceById<"Publication" | "Attribute">
    }
  >(({ getInstanceById }, { translate, translateMap }, { content: entry }) => {
    const translation = translateMap(entry.translations)

    if (translation === undefined) {
      return undefined
    }

    return {
      title: translation.name,
      className: "combat-technique close-combat-technique",
      body: [
        {
          type: "definitionList",
          items: [
            mapNullable(translation.special, value => ({
              label: translate("Special"),
              value,
            })),
            {
              label: translate("Primary Attribute"),
              value: entry.primary_attribute
                .map(
                  attrId =>
                    translateMap(
                      getInstanceById("Attribute", attrId)?.translations,
                    )?.name,
                )
                .join("/"),
            },
            renderImprovementCost(entry.improvement_cost).run({ translate }),
          ],
        },
      ],
      errata: translation.errata,
      references: entry.src,
    }
  })

/**
 * Get a JSON representation of the rules text for a ranged combat technique.
 */
export const getRangedCombatTechniqueEntityDescription =
  createEntityDescriptionCreator<
    "RangedCombatTechnique",
    {
      getInstanceById: GetInstanceById<"Publication" | "Attribute">
    }
  >(({ getInstanceById }, { translate, translateMap }, { content: entry }) => {
    const translation = translateMap(entry.translations)

    if (translation === undefined) {
      return undefined
    }

    return {
      title: translation.name,
      className: "combat-technique ranged-combat-technique",
      body: [
        {
          type: "definitionList",
          items: [
            mapNullable(translation.special, value => ({
              label: translate("Special"),
              value,
            })),
            {
              label: translate("Primary Attribute"),
              value: entry.primary_attribute
                .map(
                  attrId =>
                    translateMap(
                      getInstanceById("Attribute", attrId)?.translations,
                    )?.name,
                )
                .join("/"),
            },
            renderImprovementCost(entry.improvement_cost).run({ translate }),
          ],
        },
      ],
      errata: translation.errata,
      references: entry.src,
    }
  })
