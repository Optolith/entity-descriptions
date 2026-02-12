import {
  type Condition,
  type MetaCondition,
} from "optolith-database-schema/gen"
import { createEntityDescriptionCreator } from "../creator.js"

/**
 * Get a JSON representation of the rules text for a condition.
 */
export const getConditionEntityDescription =
  createEntityDescriptionCreator<Condition>(
    (_, { translate, translateMap }, entry) => {
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
            : { value: translation.rules },
          ...translation.effects.map((effect, index) => ({
            label: translate("Level {$level}", {
              level: index + 1,
            }),
            value: effect,
          })),
        ],
        references: entry.src,
      }
    },
  )

/**
 * Get a JSON representation of the rules text for a meta condition.
 */
export const getMetaConditionEntityDescription =
  createEntityDescriptionCreator<MetaCondition>(
    (_, { translate, translateMap }, entry) => {
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
            : { value: translation.rules },
          ...translation.effects.map((effect, index) => ({
            label: translate("Level {$level}", {
              level: index + 1,
            }),
            value: effect,
          })),
        ],
        references: entry.src,
      }
    },
  )
