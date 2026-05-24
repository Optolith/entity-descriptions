import { mapNullable } from "@elyukai/utils/nullable"
import { sign } from "@elyukai/utils/string/number"
import type { ActivatableIdentifier, RatedIdentifier } from "@optolith/database-schema/gen"
import { createEntityDescriptionCreator } from "../creator.js"
import type { GetInstanceById } from "../helpers/getTypes.js"
import { renderAlternativeNames, renderLaboratoryLevel } from "./partial/herbary.js"
import { printPlainGeneralPrerequisites } from "./partial/prerequisites/index.js"
import type { GetResolvedSelectOptionById } from "./partial/prerequisites/single/activatable.js"
import { parensIf } from "./partial/rated/activatable/parensIf.js"

/**
 * Get a JSON representation of the rules text for an elixir.
 */
export const getElixirEntityDescription = createEntityDescriptionCreator<
  "Elixir",
  {
    getInstanceById: GetInstanceById<
      | "Publication"
      | "DerivedCharacteristic"
      | ActivatableIdentifier["kind"]
      | RatedIdentifier["kind"]
      | "Race"
      | "Culture"
      | "State"
      | "Enhancement"
      | "PactCategory"
      | "PactDomain"
      | "SocialStatus"
      | "Aspect"
      | "Property"
    >
    getResolvedSelectOptionById: GetResolvedSelectOptionById
  }
>(({ getInstanceById, getResolvedSelectOptionById }, locale, { content: entry }) => {
  const { translate, translateMap } = locale
  const translation = translateMap(entry.translations)

  if (translation === undefined) {
    return undefined
  }

  return {
    title: translation.name,
    className: "elixir",
    body: [
      {
        type: "definitionList",
        items: [
          renderAlternativeNames(translate, translation.alternative_names),
          {
            label: translate("Typical Ingredients"),
            value: translation.typical_ingredients.join(", "),
          },
          {
            label: translate("Price of Ingredients/Level"),
            value: translate(".input {$value :number} {{{$value} silverthalers}}", {
              value: entry.cost_per_ingredient_level,
            }),
          },
          {
            label: translate("Laboratory"),
            value: renderLaboratoryLevel(translate, entry.laboratory),
          },
          {
            label: translate("Brewing Difficulty"),
            value: sign(entry.brewing_difficulty),
          },
          {
            label: `${translate("Prerequisites")} (${translate("Brewing Process")})`,
            value: translation.brewing_process_prerequisites ?? translate("none"),
          },
          {
            label: `${translate("AP Value")} (${translate("Trade Secret")})`,
            value:
              translate("{$value} AP", {
                value: entry.trade_secret.ap_value,
              }) +
              parensIf(
                mapNullable(
                  entry.trade_secret.prerequisites,
                  prerequisites =>
                    `${translate("Prerequisites")}: ${printPlainGeneralPrerequisites(
                      getInstanceById,
                      getResolvedSelectOptionById,
                      locale,
                      prerequisites,
                    )}`,
                ),
              ),
          },
          translation.special === undefined
            ? undefined
            : {
                label: translate("Special"),
                value: translation.special,
              },
          {
            label: translate("Quality Levels"),
            value:
              translation.quality_levels.kind === "Plain"
                ? translation.quality_levels.Plain.text
                : [
                    {
                      type: "definitionList",
                      style: "nested",
                      items: translation.quality_levels.ForEachQualityLevel.qualityLevels.map(
                        (effectForLevel, index) => ({
                          label: (index + 1).toFixed(),
                          value: effectForLevel,
                        }),
                      ),
                    },
                  ],
          },
        ],
      },
    ],
    errata: translation.errata,
    references: entry.src,
  }
})
