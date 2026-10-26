import { isNotNullish } from "@elyukai/utils/nullable"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type { ResolvedNewSkillApplication, ResolvedSkillUse } from "@optolith/database-schema/cache"
import type { ActivatableIdentifier } from "@optolith/database-schema/gen"
import { createEntityDescriptionCreator } from "../creator.js"
import type {
  GetAllChildInstancesForParent,
  GetAllInstances,
  GetInstanceById,
} from "../helpers/getTypes.js"
import type { LocaleEnvironment } from "../helpers/locale.js"
import type { GetAllResolvedNewSkillApplications, GetAllResolvedSkillUses } from "../index.js"
import {
  isEntryFromIncludedPublication,
  type PublicationOptions,
} from "../references/publicationOptions.js"
import { attributedNameFromInstance, attributedNameFromText } from "./partial/markdown.js"
import { renderImprovementCost } from "./partial/rated/improvementCost.js"
import { renderSkillCheck } from "./partial/rated/skillCheck.js"

const getUsesOrNewApplications = (
  getInstanceById: GetInstanceById<
    "Aspect" | "GeneralSelectOption" | ActivatableIdentifier["kind"] | "Publication"
  >,
  locale: LocaleEnvironment,
  items: (ResolvedNewSkillApplication | ResolvedSkillUse)[],
  publicationOptions: PublicationOptions,
) =>
  items
    .filter(instance =>
      isEntryFromIncludedPublication(
        instance.content,
        getInstanceById,
        locale.translateMap,
        publicationOptions,
      ),
    )
    .map(x => {
      const { parent: parentId } = x.content
      const name = locale.translateMap(x.content.translations)?.name

      const linkableParentId =
        parentId.kind === "GeneralSelectOption"
          ? (getInstanceById(parentId)?.parent ?? parentId)
          : parentId

      if (linkableParentId.kind === "GeneralSelectOption") {
        return name !== undefined
          ? name
          : locale.translateMap(getInstanceById(linkableParentId)?.translations)?.name
      }

      return name !== undefined
        ? attributedNameFromText(name, "new-applications-uses", linkableParentId)
        : attributedNameFromInstance(
            locale.translateMap,
            getInstanceById(parentId),
            "new-applications-uses",
            parentId,
          )

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
      "Publication" | "Attribute" | ActivatableIdentifier["kind"] | "Aspect" | "GeneralSelectOption"
    >
    getAllInstances: GetAllInstances<
      "BlessedTradition" | "Disease" | "Region" | "SkillUse" | "NewSkillApplication"
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
    { publications: publicationOptions },
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
      publicationOptions,
    )

    const uses = getUsesOrNewApplications(
      getInstanceById,
      locale,
      getAllResolvedSkillUses(id),
      publicationOptions,
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
        {
          type: "definitionList",
          items: [
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
            translation.tools === undefined
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
        },
      ],
    }
  },
)
