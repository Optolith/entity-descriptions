import { OptionalRule } from "optolith-database-schema/types/rule/OptionalRule"
import { createLibraryEntryCreator } from "../libraryEntry.js"

/**
 * Get a JSON representation of the rules text for an optional rule.
 */
export const getOptionalRuleLibraryEntry =
  createLibraryEntryCreator<OptionalRule>((entry) => ({ translateMap }) => {
    const translation = translateMap(entry.translations)

    if (translation === undefined) {
      return undefined
    }

    return {
      title: translation.name,
      className: "optional-rule",
      content: [{ value: translation.description }],
      src: entry.src,
    }
  })
