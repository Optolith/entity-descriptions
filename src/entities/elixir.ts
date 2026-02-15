import { mapNullable } from "@elyukai/utils/nullable"
import { sign } from "@elyukai/utils/string/number"
import { createEntityDescriptionCreator } from "../creator.js"
import type { GetInstanceById } from "../helpers/getTypes.js"
import { renderLaboratoryLevel } from "./partial/herbary.js"
import { printPlainGeneralPrerequisites } from "./partial/prerequisites/index.js"
import type { GetResolvedSelectOptionById } from "./partial/prerequisites/single/activatable.js"
import { parensIf } from "./partial/rated/activatable/parensIf.js"

/**
 * Get a JSON representation of the rules text for an elixir.
 */
export const getElixirEntityDescription = createEntityDescriptionCreator<
  "Elixir",
  {
    getInstanceById: GetInstanceById<"DerivedCharacteristic">
    getResolvedSelectOptionById: GetResolvedSelectOptionById
  }
>(
  (
    { getInstanceById, getResolvedSelectOptionById },
    locale,
    { content: entry },
  ) => {
    const { translate, translateMap } = locale
    const translation = translateMap(entry.translations)

    if (translation === undefined) {
      return undefined
    }

    return {
      title: translation.name,
      className: "elixir",
      body: [
        translation.alternative_names === undefined
          ? undefined
          : {
              label: translate(
                ".input {$hiddenCount :number} {{Alternative Names}}",
                { hiddenCount: translation.alternative_names.length },
              ),
              value: translation.alternative_names
                .map(name => name.name + parensIf(name.region))
                .join(", "),
            },
        {
          label: translate("Typical Ingredients"),
          value: translation.typical_ingredients.join(", "),
        },
        {
          label: translate("Price of Ingredients/Level"),
          value: translate(
            ".input {$value :number} {{{$value} silverthalers}}",
            { value: entry.cost_per_ingredient_level },
          ),
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
          label: `${translate("Prerequisites")} (${translate(
            "Brewing Process",
          )})`,
          value:
            translation?.brewing_process_prerequisites ?? translate("none"),
        },
        {
          label: `${translate("AP Value")} (${translate("Trade Secret")})`,
          value:
            translate("{$value} AP", { value: entry.trade_secret.ap_value }) +
            parensIf(
              mapNullable(
                entry.trade_secret.prerequisites,
                prerequisites =>
                  `${translate(
                    "Prerequisites",
                  )}: ${printPlainGeneralPrerequisites(
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
          value: translation.quality_levels.map((effectForLevel, index) => ({
            label: (index + 1).toString(),
            value: effectForLevel,
          })),
        },
      ],
      errata: translation.errata,
      references: entry.src,
    }
  },
)
