import { on } from "@elyukai/utils/function"
import { compareNullish } from "@elyukai/utils/ordering"
import { romanize } from "@elyukai/utils/roman"
import { numAsc } from "@optolith/helpers/compare"
import { createEntityDescriptionCreator } from "../creator.js"
import type { GetInstanceById } from "../helpers/getTypes.js"
import { printPersonalityTraitPrerequisites } from "./partial/prerequisites/index.js"
import { MISSING_VALUE } from "./partial/unknown.js"

/**
 * Get a JSON representation of the rules text for a .
 */
export const getPersonalityTraitEntityDescription =
  createEntityDescriptionCreator<
    "PersonalityTrait",
    {
      getInstanceById: GetInstanceById<
        "Publication" | "Race" | "Culture" | "PersonalityTrait"
      >
    }
  >(({ getInstanceById }, locale, { content: entry }) => {
    const { translate, translateMap, join: localeJoin } = locale
    const translation = translateMap(entry.translations)

    if (translation === undefined) {
      return undefined
    }

    return {
      title: `${translation.name} (${translate("Level {$level}", {
        level: romanize(entry.level),
      })})`,
      className: "personality-trait",
      body: [
        {
          type: "definitionList",
          items: [
            ...(translation.effects.map(effect => ({
              label: effect.label,
              value: effect.text,
            })) ?? []),
            entry.combination_options === undefined
              ? undefined
              : {
                  label: translate("Can be combined with"),
                  value: Map.groupBy(
                    entry.combination_options.map(optionId =>
                      getInstanceById("PersonalityTrait", optionId),
                    ),
                    option => option?.level ?? null,
                  )
                    .entries()
                    .toArray()
                    .toSorted(on(group => group[0], compareNullish(numAsc)))
                    .map(([level, options]) =>
                      level === null
                        ? MISSING_VALUE
                        : `${translate("Level {$level}", { level: romanize(level) })} ${localeJoin(
                            options.map(
                              option =>
                                translateMap(option?.translations)?.name ??
                                MISSING_VALUE,
                            ),
                            "disjunction",
                          )}`,
                    )
                    .join(", "),
                },
            entry.prerequisites === undefined
              ? undefined
              : {
                  label: translate("Prerequisites"),
                  value: printPersonalityTraitPrerequisites(
                    getInstanceById,
                    locale,
                    entry.prerequisites,
                  ),
                },
          ],
        },
      ],
      errata: translation.errata,
      references: entry.src,
    }
  })
