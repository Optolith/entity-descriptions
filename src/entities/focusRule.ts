import { romanize } from "@optolith/helpers/roman"
import { FocusRule } from "optolith-database-schema/types/rule/FocusRule"
import { GetById } from "../helpers/getTypes.js"
import { createEntityDescriptionCreator } from "../index.js"

/**
 * Get a JSON representation of the rules text for a focus rule.
 */
export const getFocusRuleEntityDescription = createEntityDescriptionCreator<
  FocusRule,
  { getSubjectById: GetById.Static.Subject }
>(({ getSubjectById }, { translateMap }, entry) => {
  const translation = translateMap(entry.translations)

  if (translation === undefined) {
    return undefined
  }

  return {
    title: `${translation.name} (${romanize(entry.level)})`,
    subtitle: translateMap(
      getSubjectById(entry.subject.id.subject)?.translations
    )?.name,
    className: "focus-rule",
    body: [{ value: translation.description }],
    references: entry.src,
  }
})
