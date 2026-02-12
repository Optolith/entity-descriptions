import { type State } from "optolith-database-schema/gen"
import { createEntityDescriptionCreator } from "../creator.js"

/**
 * Get a JSON representation of the rules text for a state.
 */
export const getStateEntityDescription = createEntityDescriptionCreator<State>(
  (_, { translateMap }, entry) => {
    const translation = translateMap(entry.translations)

    if (translation === undefined) {
      return undefined
    }

    return {
      title: translation.name,
      className: "state",
      body: [{ value: translation.description }],
      references: entry.src,
    }
  },
)
