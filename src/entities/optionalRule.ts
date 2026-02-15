import { createEntityDescriptionCreator } from "../creator.js"

/**
 * Get a JSON representation of the rules text for an optional rule.
 */
export const getOptionalRuleEntityDescription =
  createEntityDescriptionCreator<"OptionalRule">(
    (_, { translateMap }, { content: entry }) => {
      const translation = translateMap(entry.translations)

      if (translation === undefined) {
        return undefined
      }

      return {
        title: translation.name,
        className: "optional-rule",
        body: [{ value: translation.description }],
        errata: translation.errata,
        references: entry.src,
      }
    },
  )
