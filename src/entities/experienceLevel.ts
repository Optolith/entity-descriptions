import { ExperienceLevel } from "optolith-database-schema/types/ExperienceLevel"
import { createLibraryEntryCreator } from "../libraryEntry.js"

/**
 * Get a JSON representation of the rules text for an experience level.
 */
export const getExperienceLevelLibraryEntry =
  createLibraryEntryCreator<ExperienceLevel>(
    (entry) =>
      ({ translate, translateMap }) => {
        const translation = translateMap(entry.translations)

        if (translation === undefined) {
          return undefined
        }

        return {
          title: translation.name,
          className: "experience-level",
          content: [
            {
              label: translate("Adventure Points"),
              value: entry.adventure_points,
            },
            {
              label: translate("Maximum Attribute Value"),
              value: entry.max_attribute_value,
            },
            {
              label: translate("Maximum Skill Value"),
              value: entry.max_skill_rating,
            },
            {
              label: translate("Maximum Combat Technique"),
              value: entry.max_combat_technique_rating,
            },
            {
              label: translate("Maximum Attribute Total"),
              value: entry.max_attribute_total,
            },
            {
              label: translate("Number of Spells/Liturgical Chants"),
              value: entry.max_number_of_spells_liturgical_chants,
            },
            {
              label: translate("Number from other Traditions"),
              value: entry.max_number_of_unfamiliar_spells,
            },
          ],
        }
      }
  )
