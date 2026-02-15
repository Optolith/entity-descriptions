import { createEntityDescriptionCreator } from "../creator.js"

/**
 * Get a JSON representation of the rules text for a state.
 */
export const getStateEntityDescription =
  createEntityDescriptionCreator<"State">(
    (_, { translateMap }, { content: entry }) => {
      const translation = translateMap(entry.translations)

      if (translation === undefined) {
        return undefined
      }

      return {
        title: translation.name,
        className: "state",
        body: [{ value: translation.description }],
        errata: translation.errata,
        references: entry.src,
      }
    },
  )
