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
>(({ getInstanceById }, { translateMap }, entry) => {
  const translation = translateMap(entry.translations)

  if (translation === undefined) {
    return undefined
  }

  return {
    title: `${translation.name} (${romanize(entry.level)})`,
    subtitle:
      entry.subject !== undefined
        ? translateMap(getInstanceById("Subject", entry.subject)?.translations)
            ?.name
        : undefined,
    className: "focus-rule",
    body: [{ value: translation.description }],
    references: entry.src,
  }
})
