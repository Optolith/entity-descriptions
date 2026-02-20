import { isNotNullish } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type {
  ResolvedNewSkillApplication,
  ResolvedSkillUse,
} from "optolith-database-schema/cache"
import type { ActivatableIdentifier } from "optolith-database-schema/gen"
import { fromUniformCase } from "tsondb/schema/gen"
import { createEntityDescriptionCreator } from "../creator.js"
import type {
  GetAllChildInstancesForParent,
  GetAllInstances,
  GetInstanceById,
} from "../helpers/getTypes.js"
import type { LocaleEnvironment } from "../helpers/locale.js"
import type {
  GetAllResolvedNewSkillApplications,
  GetAllResolvedSkillUses,
} from "../index.js"
import { BaseActivatableTranslation } from "./activatable.js"
import { renderImprovementCost } from "./partial/rated/improvementCost.js"
import { renderSkillCheck } from "./partial/rated/skillCheck.js"

const getUsesOrNewApplications = <
  T extends ResolvedNewSkillApplication | ResolvedSkillUse,
>(
  getInstanceById: GetInstanceById<"Aspect" | ActivatableIdentifier["kind"]>,
  locale: LocaleEnvironment,
  items: T[],
) =>
  items
    .map(x => {
      const name = locale.translateMap(x.content.translations)?.name
      if (name !== undefined) {
        return name
      }
      const { parent: parentId } = x.content
      if (parentId.kind === "GeneralSelectOption") {
        return undefined
      }
      return locale.translateMap<BaseActivatableTranslation>(
        getInstanceById(parentId.kind, fromUniformCase(parentId))?.translations,
      )?.name
      // if (parentTranslations === undefined) {
      //   return undefined
      // }
      // return printActivatableNameChunk(
      //   locale,
      //   getNameComponents<BaseSpecialAbilityTranslation>(
      //     getInstanceById,
      //     locale,
      //     parentId,
      //     undefined,
      //     undefined,
      //     parentTranslations,
      //     translation => translation.name,
      //     id => getResolvedSelectOptionById(parentId, id),
      //     false,
      //   ).full,
      // )
    })
    .filter(isNotNullish)
    .sort(locale.compare)

/**
 * Get a JSON representation of the rules text for a skill.
 */
export const getSkillEntityDescription = createEntityDescriptionCreator<
  "Skill",
  {
    getInstanceById: GetInstanceById<
      "Publication" | "Attribute" | ActivatableIdentifier["kind"] | "Aspect"
    >
    getAllInstances: GetAllInstances<
      | "BlessedTradition"
      | "Disease"
      | "Region"
      | "SkillUse"
      | "NewSkillApplication"
    >
    getChildInstancesForInstanceId: GetAllChildInstancesForParent<"SkillApplication">
    getAllResolvedNewSkillApplications: GetAllResolvedNewSkillApplications
    getAllResolvedSkillUses: GetAllResolvedSkillUses
  }
>(
  (
    {
      getInstanceById,
      getAllInstances,
      getChildInstancesForInstanceId,
      getAllResolvedNewSkillApplications,
      getAllResolvedSkillUses,
    },
    locale,
    { content: entry, id },
  ) => {
    const { translate, translateMap, compare: localeCompare } = locale
    const translation = translateMap(entry.translations)

    if (translation === undefined) {
      return undefined
    }

    const newApplications = getUsesOrNewApplications(
      getInstanceById,
      locale,
      getAllResolvedNewSkillApplications(id),
    )

    const uses = getUsesOrNewApplications(
      getInstanceById,
      locale,
      getAllResolvedSkillUses(id),
    )

    const applications = [
      ...getChildInstancesForInstanceId("SkillApplication", id)
        .map(x => translateMap(x.content.translations)?.name)
        .filter(isNotNullish)
        .sort(localeCompare),
      ...(() => {
        switch (entry.applications.derived?.kind) {
          case "BlessedTraditions":
            return getAllInstances("BlessedTradition")
              .map(x => translateMap(x.content.translations)?.name)
              .filter(isNotNullish)
              .sort(localeCompare)
          case "Diseases":
            return getAllInstances("Disease")
              .map(x => translateMap(x.content.translations)?.name)
              .filter(isNotNullish)
              .sort(localeCompare)
          case "Regions":
            return getAllInstances("Region")
              .map(x => translateMap(x.content.translations)?.name)
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
        renderSkillCheck(entry.check).run({
          translate,
          translateMap,
          getInstanceById,
        }),
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
                : (translation.encumbrance_description ?? translate("Maybe")),
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
        renderImprovementCost(entry.improvement_cost).run({ translate }),
      ],
    }
  },
)
