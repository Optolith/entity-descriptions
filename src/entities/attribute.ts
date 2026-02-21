import { createEntityDescriptionCreator } from "../creator.js"

/**
 * Get a JSON representation of the rules text for an attribute.
 */
export const getAttributeEntityDescription =
  createEntityDescriptionCreator<"Attribute">(
    (_, { translateMap }, { content: entry }) => {
      const translation = translateMap(entry.translations)

      if (translation === undefined) {
        return undefined
      }

      return {
        title: `${translation.name} (${translation.abbreviation})`,
        className: "attribute",
        body: [{ type: "plain", text: translation.description }],
      }
    },
  )
