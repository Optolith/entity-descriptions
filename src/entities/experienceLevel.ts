import { createEntityDescriptionCreator } from "../creator.js"

/**
 * Get a JSON representation of the rules text for an experience level.
 */
export const getExperienceLevelEntityDescription =
  createEntityDescriptionCreator<"ExperienceLevel">(
    (_, { translate, translateMap }, { content: entry }) => {
      const translation = translateMap(entry.translations)

      if (translation === undefined) {
        return undefined
      }

      return {
        title: translation.name,
        className: "experience-level",
        body: [
          {
            type: "definitionList",
            items: [
              {
                label: translate("Adventure Points"),
                value: entry.adventure_points.toFixed(),
              },
              {
                label: translate("Maximum Attribute Value"),
                value: entry.max_attribute_value.toFixed(),
              },
              {
                label: translate("Maximum Skill Value"),
                value: entry.max_skill_rating.toFixed(),
              },
              {
                label: translate("Maximum Combat Technique"),
                value: entry.max_combat_technique_rating.toFixed(),
              },
              {
                label: translate("Maximum Attribute Total"),
                value: entry.max_attribute_total.toFixed(),
              },
              {
                label: translate("Number of Spells/Liturgical Chants"),
                value: entry.max_number_of_spells_liturgical_chants.toFixed(),
              },
              {
                label: translate("Number from other Traditions"),
                value: entry.max_number_of_unfamiliar_spells.toFixed(),
              },
            ],
          },
        ],
      }
    },
  )
