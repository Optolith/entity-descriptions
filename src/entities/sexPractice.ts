import { createEntityDescriptionCreator } from "../creator.js"

/**
 * Get a JSON representation of the rules text for a sex practice.
 */
export const getSexPracticeEntityDescription =
  createEntityDescriptionCreator<"SexPractice">(
    (_, { translate, translateMap }, { content: entry }) => {
      const translation = translateMap(entry.translations)

      if (translation === undefined) {
        return undefined
      }

      return {
        title: translation.name,
        className: "sex-practice",
        body: [
          { label: translate("Rules"), value: translation.rules },
          { label: translate("Duration"), value: translation.duration },
          translation.prerequisites === undefined
            ? undefined
            : {
                label: translate("Prerequisites"),
                value: translation.prerequisites,
              },
          translation.failed === undefined
            ? undefined
            : { label: translate("Failed"), value: translation.failed },
        ],
        references: entry.src,
      }
    },
  )
