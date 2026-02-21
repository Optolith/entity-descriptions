import { createEntityDescriptionCreator } from "../creator.js"
import type { GetInstanceById } from "../helpers/getTypes.js"
import { MISSING_VALUE } from "./partial/unknown.js"

/**
 * Get a JSON representation of the rules text for an alternative rule.
 */
export const getAlternativeRuleEntityDescription =
  createEntityDescriptionCreator<
    "AlternativeRule",
    { getInstanceById: GetInstanceById<"Publication" | "PlayerType"> }
  >(({ getInstanceById }, { translateMap }, { content: entry }) => {
    const translation = translateMap(entry.translations)

    if (translation === undefined) {
      return undefined
    }

    return {
      title: translation.name,
      subtitle: entry.playerTypes
        .map(
          playerType =>
            translateMap(
              getInstanceById("PlayerType", playerType)?.translations,
            )?.name ?? MISSING_VALUE,
        )
        .join(", "),
      className: "alternative-rule",
      body: [{ type: "plain", text: translation.description }],
      errata: translation.errata,
      references: entry.src,
    }
  })
