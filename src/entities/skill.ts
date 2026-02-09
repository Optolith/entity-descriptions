import { isNotNullish } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type { Skill } from "optolith-database-schema/gen"
import { createEntityDescriptionCreator } from "../creator.js"
import type {
  GetAllChildInstancesForParent,
  GetAllInstances,
  GetInstanceById,
} from "../helpers/getTypes.js"
import { createImprovementCost } from "./partial/rated/improvementCost.js"
import { getTextForCheck } from "./partial/rated/skillCheck.js"

/**
 * Get a JSON representation of the rules text for a skill.
 */
export const getSkillEntityDescription = createEntityDescriptionCreator<
  Skill,
  {
    getInstanceById: GetInstanceById<"Attribute">
    getAllInstances: GetAllInstances<
      | "BlessedTradition"
      | "Disease"
      | "Region"
      | "SkillUse"
      | "NewSkillApplication"
    >
    getChildInstancesForInstanceId: GetAllChildInstancesForParent<"SkillApplication">
  }
>(
  (
    { getInstanceById, getAllInstances, getChildInstancesForInstanceId },
    { translate, translateMap, compare: localeCompare },
    entry,
    id,
  ) => {
    const translation = translateMap(entry.translations)

    if (translation === undefined) {
      return undefined
    }

    const newApplications = getAllInstances("NewSkillApplication")
      .filter(application => application.skills.includes(id))
      .map(x => translateMap(x.translations)?.name)
      .filter(isNotNullish)
      .sort(localeCompare)

    const uses = getAllInstances("SkillUse")
      .filter(use => use.skills.includes(id))
      .map(x => translateMap(x.translations)?.name)
      .filter(isNotNullish)
      .sort(localeCompare)

    const applications = [
      ...getChildInstancesForInstanceId("SkillApplication", id)
        .map(x => translateMap(x.translations)?.name)
        .filter(isNotNullish)
        .sort(localeCompare),
      ...(() => {
        switch (entry.applications.derived?.kind) {
          case "BlessedTraditions":
            return getAllInstances("BlessedTradition")
              .map(x => translateMap(x.translations)?.name)
              .filter(isNotNullish)
              .sort(localeCompare)
          case "Diseases":
            return getAllInstances("Disease")
              .map(x => translateMap(x.translations)?.name)
              .filter(isNotNullish)
              .sort(localeCompare)
          case "Regions":
            return getAllInstances("Region")
              .map(x => translateMap(x.translations)?.name)
              .filter(isNotNullish)
              .sort(localeCompare)
          case undefined:
            return []
          default:
            return assertExhaustive(entry.applications.derived)
        }
      })(),
    ]

    return {
      title: translation.name,
      className: "skill",
      body: [
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
          { translate, translateMap, getInstanceById },
          entry.check,
        ),
        {
          label: translate("Applications"),
          value: applications.join(", "),
        },
        {
          label: translate("Encumbrance"),
          value:
            entry.encumbrance.kind === "Yes"
              ? translate("Yes")
              : entry.encumbrance.kind === "No"
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
  },
)
