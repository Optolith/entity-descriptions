import { createEntityDescriptionCreator } from "../creator.js"
import type { GetInstanceById } from "../helpers/getTypes.js"
import { printInfluencePrerequisites } from "./partial/prerequisites/index.js"

/**
 * Get a JSON representation of the rules text for an influence.
 */
export const getInfluenceEntityDescription = createEntityDescriptionCreator<
  "Influence",
  {
    getInstanceById: GetInstanceById<"Publication" | "Influence">
  }
>(({ getInstanceById }, locale, { content: entry }) => {
  const { translate, translateMap } = locale
  const translation = translateMap(entry.translations)

  if (translation === undefined) {
    return undefined
  }

  return {
    title: translation.name,
    className: "influence",
    body: [
      {
        type: "definitionList",
        items: [
          ...(translation.effects?.map(effect => ({
            label: effect.label,
            value: effect.text,
          })) ?? []),
          entry.prerequisites === undefined
            ? undefined
            : {
                label: translate("Prerequisites"),
                value: printInfluencePrerequisites(getInstanceById, locale, entry.prerequisites),
              },
        ],
      },
    ],
    errata: translation.errata,
    references: entry.src,
  }
})
