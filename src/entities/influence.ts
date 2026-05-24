import type { ActivatableIdentifier } from "@optolith/database-schema/gen"
import { createEntityDescriptionCreator } from "../creator.js"
import type { GetAllChildInstancesForParent, GetInstanceById } from "../helpers/getTypes.js"
import { printInfluencePrerequisites } from "./partial/prerequisites/index.js"
import type { GetResolvedSelectOptionById } from "./partial/prerequisites/single/activatable.js"

/**
 * Get a JSON representation of the rules text for an influence.
 */
export const getInfluenceEntityDescription = createEntityDescriptionCreator<
  "Influence",
  {
    getInstanceById: GetInstanceById<
      "Publication" | "Influence" | "Race" | ActivatableIdentifier["kind"] | "Aspect"
    >
    getResolvedSelectOptionById: GetResolvedSelectOptionById
    getChildInstancesForInstanceId: GetAllChildInstancesForParent<"ProfessionVersion">
  }
>(
  (
    { getInstanceById, getResolvedSelectOptionById, getChildInstancesForInstanceId },
    locale,
    { content: entry },
  ) => {
    const { translate, translateMap } = locale
    const translation = translateMap(entry.translations)

    if (translation === undefined) {
      return undefined
    }

    return {
      title: translation.name,
      className: "influence",
      body: [
        translation.rules === undefined
          ? undefined
          : {
              type: "plain",
              text: translation.rules,
            },
        translation.effects === undefined || translation.effects.length === 0
          ? undefined
          : {
              type: "definitionList",
              items: [
                ...translation.effects.map(effect => ({
                  label: effect.label,
                  value: effect.text,
                })),
                entry.prerequisites === undefined
                  ? undefined
                  : {
                      label: translate("Prerequisites"),
                      value: printInfluencePrerequisites(
                        getInstanceById,
                        getResolvedSelectOptionById,
                        getChildInstancesForInstanceId,
                        locale,
                        entry.prerequisites,
                      ),
                    },
              ],
            },
      ],
      errata: translation.errata,
      references: entry.src,
    }
  },
)
