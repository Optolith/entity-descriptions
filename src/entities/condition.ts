import { createEntityDescriptionCreator } from "../creator.js"

/**
 * Get a JSON representation of the rules text for a condition.
 */
export const getConditionEntityDescription =
  createEntityDescriptionCreator<"Condition">(
    (_, { translate, translateMap }, { content: entry }) => {
      const translation = translateMap(entry.translations)

      if (translation === undefined) {
        return undefined
      }

      return {
        title: translation.name,
        className: "condition",
        body: [
          translation.rules === undefined
            ? undefined
            : { type: "plain", text: translation.rules },
          {
            type: "definitionList",
            items: [
              ...translation.effects.map((effect, index) => ({
                label: translate("Level {$level}", {
                  level: index + 1,
                }),
                value: effect,
              })),
            ],
          },
        ],
        errata: translation.errata,
        references: entry.src,
      }
    },
  )

/**
 * Get a JSON representation of the rules text for a meta condition.
 */
export const getMetaConditionEntityDescription =
  createEntityDescriptionCreator<"MetaCondition">(
    (_, { translate, translateMap }, { content: entry }) => {
      const translation = translateMap(entry.translations)

      if (translation === undefined) {
        return undefined
      }

      return {
        title: translation.name,
        className: "meta-condition",
        body: [
          translation.rules === undefined
            ? undefined
            : { type: "plain", text: translation.rules },
          {
            type: "definitionList",
            items: [
              ...translation.effects.map((effect, index) => ({
                label: translate("Level {$level}", {
                  level: index + 1,
                }),
                value: effect,
              })),
            ],
          },
        ],
        errata: translation.errata,
        references: entry.src,
      }
    },
  )
