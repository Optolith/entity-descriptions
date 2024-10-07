import { OptionalRule } from "optolith-database-schema/types/rule/OptionalRule"
import { createEntityDescriptionCreator } from "../index.js"

/**
 * Get a JSON representation of the rules text for an optional rule.
 */
export const getOptionalRuleLibraryEntry =
  createEntityDescriptionCreator<OptionalRule>((_, { translateMap }, entry) => {
    const translation = translateMap(entry.translations)

    if (translation === undefined) {
      return undefined
    }

    return {
      title: translation.name,
      className: "optional-rule",
      body: [{ value: translation.description }],
      references: entry.src,
    }
  })
