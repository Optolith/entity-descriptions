import { romanize } from "@optolith/helpers/roman"
import type { FocusRule } from "optolith-database-schema/gen"
import { createEntityDescriptionCreator } from "../creator.js"
import type { GetInstanceById } from "../helpers/getTypes.js"

/**
 * Get a JSON representation of the rules text for a focus rule.
 */
export const getFocusRuleEntityDescription = createEntityDescriptionCreator<
  FocusRule,
  { getInstanceById: GetInstanceById<"Subject"> }
>(({ getInstanceById }, { translate, translateMap }, entry) => {
  const translation = translateMap(entry.translations)
  const topicTranslation = translateMap(
    getInstanceById("Subject", entry.subject)?.translations,
  )

  if (translation === undefined || topicTranslation === undefined) {
    return undefined
  }

  return {
    title: `${translation.name} (${romanize(entry.level)})`,
    subtitle: topicTranslation.name,
    className: "focus-rule",
    body: [
      {
        value: translate(
          "The following rule is a Level {$level} focus rule for the topic {$topic}.",
          { level: romanize(entry.level), topic: topicTranslation.name },
        ),
      },
      { value: translation.description },
    ],
    references: entry.src,
  }
})
