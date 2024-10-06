import { isNotNullish } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import { NewApplicationsAndUsesCache } from "optolith-database-schema/cache/newApplicationsAndUses"
import { Skill } from "optolith-database-schema/types/Skill"
import { All, GetById } from "../helpers/getTypes.js"
import { createLibraryEntryCreator } from "../libraryEntry.js"
import { createImprovementCost } from "./partial/rated/improvementCost.js"
import { getTextForCheck } from "./partial/rated/skillCheck.js"

/**
 * Get a JSON representation of the rules text for a skill.
 */
export const getSkillLibraryEntry = createLibraryEntryCreator<
  Skill,
  {
    getAttributeById: GetById.Static.Attribute
    blessedTraditions: All.Static.BlessedTraditions
    diseases: All.Static.Diseases
    regions: All.Static.Regions
    cache: NewApplicationsAndUsesCache
  }
>(
  (entry, { getAttributeById, blessedTraditions, diseases, regions, cache }) =>
    ({ translate, translateMap, compare: localeCompare }) => {
      const translation = translateMap(entry.translations)

      if (translation === undefined) {
        return undefined
      }

      const newApplications = (
        entry === undefined ? [] : cache.newApplications[entry.id] ?? []
      )
        .map((x) => translateMap(x.data.translations)?.name)
        .filter(isNotNullish)
        .sort(localeCompare)

      const uses = (entry === undefined ? [] : cache.uses[entry.id] ?? [])
        .map((x) => translateMap(x.data.translations)?.name)
        .filter(isNotNullish)
        .sort(localeCompare)

      const applications = (() => {
        switch (entry.applications.tag) {
          case "Derived":
            return (() => {
              switch (entry.applications.derived) {
                case "BlessedTraditions":
                  return Object.values(blessedTraditions)
                    .map((x) => translateMap(x.translations)?.name)
                    .filter(isNotNullish)
                    .sort(localeCompare)
                case "Diseases":
                  return Object.values(diseases)
                    .map((x) => translateMap(x.translations)?.name)
                    .filter(isNotNullish)
                    .sort(localeCompare)
                case "Regions":
                  return Object.values(regions)
                    .map((x) => translateMap(x.translations)?.name)
                    .filter(isNotNullish)
                    .sort(localeCompare)
                default:
                  return assertExhaustive(entry.applications.derived)
              }
            })()
          case "Explicit":
            return entry.applications.explicit
              .map((x) => translateMap(x.translations)?.name)
              .filter(isNotNullish)
              .sort(localeCompare)
          default:
            return assertExhaustive(entry.applications)
        }
      })()

      return {
        title: translation.name,
        className: "skill",
        content: [
          newApplications.length === 0
            ? undefined
            : {
                label: translate("New Applications"),
                value: newApplications.join(", "),
              },
          uses.length === 0
            ? undefined
            : {
                label: translate("Uses"),
                value: uses.join(", "),
              },
          getTextForCheck(
            { translate, translateMap, getAttributeById },
            entry.check
          ),
          {
            label: translate("Applications"),
            value: applications.join(", "),
          },
          {
            label: translate("Encumbrance"),
            value:
              entry.encumbrance === "True"
                ? translate("Yes")
                : entry.encumbrance === "False"
                ? translate("No")
                : translation.encumbrance_description ?? translate("Maybe"),
          },
          translation?.tools === undefined
            ? undefined
            : {
                label: translate("Tools"),
                value: translation.tools,
              },
          {
            label: translate("Quality"),
            value: translation.quality,
          },
          {
            label: translate("Failed Check"),
            value: translation.failed,
          },
          {
            label: translate("Critical Success"),
            value: translation.critical,
          },
          {
            label: translate("Botch"),
            value: translation.botch,
          },
          createImprovementCost(translate, entry.improvement_cost),
        ],
      }
    }
)
