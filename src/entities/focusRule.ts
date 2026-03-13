import { romanize } from "@optolith/helpers/roman"
import { createEntityDescriptionCreator } from "../creator.js"
import type { GetInstanceById } from "../helpers/getTypes.js"

/**
 * Get a JSON representation of the rules text for a focus rule.
 */
export const getFocusRuleEntityDescription = createEntityDescriptionCreator<
  "FocusRule",
  { getInstanceById: GetInstanceById<"Publication" | "Subject"> }
>(({ getInstanceById }, { translate, translateMap }, { content: entry }) => {
  const translation = translateMap(entry.translations)
  const topicTranslation = translateMap(getInstanceById("Subject", entry.subject)?.translations)

  if (translation === undefined || topicTranslation === undefined) {
    return undefined
  }

  return {
    title: translation.name,
    badge: entry.level,
    className: "focus-rule",
    body: [
      {
        type: "plain",
        text: translate(
          "The following rule is a Level {$level} focus rule for the topic {$topic}.",
          { level: romanize(entry.level), topic: topicTranslation.name },
        ),
      },
      { type: "plain", text: translation.description },
    ],
    errata: translation.errata,
    references: entry.src,
  }
})
