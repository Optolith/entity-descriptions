import { mapNullable } from "@optolith/helpers/nullable"
import { CloseCombatTechnique } from "optolith-database-schema/types/CombatTechnique_Close"
import { RangedCombatTechnique } from "optolith-database-schema/types/CombatTechnique_Ranged"
import { GetById } from "../helpers/getTypes.js"
import { createLibraryEntryCreator } from "../libraryEntry.js"
import { createImprovementCost } from "./partial/rated/improvementCost.js"

/**
 * Get a JSON representation of the rules text for a close combat technique.
 */
export const getCloseCombatTechniqueLibraryEntry = createLibraryEntryCreator<
  CloseCombatTechnique,
  {
    getAttributeById: GetById.Static.Attribute
  }
>((entry, { getAttributeById }) => ({ translate, translateMap }) => {
  const translation = translateMap(entry.translations)

  if (translation === undefined) {
    return undefined
  }

  return {
    title: translation.name,
    className: "combat-technique close-combat-technique",
    content: [
      mapNullable(translation.special, (value) => ({
        label: translate("Special"),
        value,
      })),
      {
        label: translate("Primary Attribute"),
        value: entry.primary_attribute
          .map(
            (attr) =>
              translateMap(getAttributeById(attr.id.attribute)?.translations)
                ?.name
          )
          .join("/"),
      },
      createImprovementCost(translate, entry.improvement_cost),
    ],
    src: entry.src,
  }
})

/**
 * Get a JSON representation of the rules text for a ranged combat technique.
 */
export const getRangedCombatTechniqueLibraryEntry = createLibraryEntryCreator<
  RangedCombatTechnique,
  {
    getAttributeById: GetById.Static.Attribute
  }
>((entry, { getAttributeById }) => ({ translate, translateMap }) => {
  const translation = translateMap(entry.translations)

  if (translation === undefined) {
    return undefined
  }

  return {
    title: translation.name,
    className: "combat-technique ranged-combat-technique",
    content: [
      mapNullable(translation.special, (value) => ({
        label: translate("Special"),
        value,
      })),
      {
        label: translate("Primary Attribute"),
        value: entry.primary_attribute
          .map(
            (attr) =>
              translateMap(getAttributeById(attr.id.attribute)?.translations)
                ?.name
          )
          .join("/"),
      },
      createImprovementCost(translate, entry.improvement_cost),
    ],
    src: entry.src,
  }
})
