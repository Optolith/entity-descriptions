import { mapNullable } from "@optolith/helpers/nullable"
import {
  CloseCombatTechnique,
  RangedCombatTechnique,
} from "optolith-database-schema/gen"
import { createEntityDescriptionCreator } from "../creator.js"
import type { GetInstanceById } from "../helpers/getTypes.js"
import { createImprovementCost } from "./partial/rated/improvementCost.js"

/**
 * Get a JSON representation of the rules text for a close combat technique.
 */
export const getCloseCombatTechniqueEntityDescription =
  createEntityDescriptionCreator<
    CloseCombatTechnique,
    {
      getInstanceById: GetInstanceById<"Attribute">
    }
  >(({ getInstanceById }, { translate, translateMap }, entry) => {
    const translation = translateMap(entry.translations)

    if (translation === undefined) {
      return undefined
    }

    return {
      title: translation.name,
      className: "combat-technique close-combat-technique",
      body: [
        mapNullable(translation.special, value => ({
          label: translate("Special"),
          value,
        })),
        {
          label: translate("Primary Attribute"),
          value: entry.primary_attribute
            .map(
              attrId =>
                translateMap(getInstanceById("Attribute", attrId)?.translations)
                  ?.name,
            )
            .join("/"),
        },
        createImprovementCost(translate, entry.improvement_cost),
      ],
      references: entry.src,
    }
  })

/**
 * Get a JSON representation of the rules text for a ranged combat technique.
 */
export const getRangedCombatTechniqueEntityDescription =
  createEntityDescriptionCreator<
    RangedCombatTechnique,
    {
      getInstanceById: GetInstanceById<"Attribute">
    }
  >(({ getInstanceById }, { translate, translateMap }, entry) => {
    const translation = translateMap(entry.translations)

    if (translation === undefined) {
      return undefined
    }

    return {
      title: translation.name,
      className: "combat-technique ranged-combat-technique",
      body: [
        mapNullable(translation.special, value => ({
          label: translate("Special"),
          value,
        })),
        {
          label: translate("Primary Attribute"),
          value: entry.primary_attribute
            .map(
              attrId =>
                translateMap(getInstanceById("Attribute", attrId)?.translations)
                  ?.name,
            )
            .join("/"),
        },
        createImprovementCost(translate, entry.improvement_cost),
      ],
      references: entry.src,
    }
  })
