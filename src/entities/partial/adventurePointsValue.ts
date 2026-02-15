import { on } from "@elyukai/utils/function"
import { unique } from "@optolith/helpers/array"
import { deepEqual, numAsc } from "@optolith/helpers/compare"
import { romanize } from "@optolith/helpers/roman"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type {
  ResolvedSelectOption,
  ResolvedSelectOptionIdentifier,
} from "optolith-database-schema/cache"
import type {
  ActivatableIdentifier,
  AdventurePointsValue,
  SelectOptionsAdventurePointsValue,
} from "optolith-database-schema/gen"
import type { GetAllInstances } from "../../helpers/getTypes.js"
import type { LocaleEnvironment } from "../../helpers/locale.js"
import type {
  BaseActivatable,
  BaseActivatableTranslation,
} from "../activatable.js"
import { evaluateMathOperation } from "./mathOperation.js"
import { MISSING_VALUE } from "./unknown.js"

const renderSelectOptionsAdventurePointsValue = <
  T extends ResolvedSelectOptionIdentifier,
>(
  locale: LocaleEnvironment,
  derivedLabel: () => string,
  getAllSelectOptions: () => ResolvedSelectOption[],
  getNameForSelectOptionId: (
    id: ResolvedSelectOptionIdentifier,
  ) => string | undefined,
  config: SelectOptionsAdventurePointsValue<T> | undefined,
) => {
  if (config === undefined) {
    return MISSING_VALUE
  }
  switch (config.kind) {
    case "DerivedFromImprovementCost": {
      const start = derivedLabel()
      return `${start}: ${locale.translate("{$value} Adventure Points", {
        value: Array.from(
          { length: 4 },
          (_, index) =>
            (index + 1) * (config.DerivedFromImprovementCost.multiplier ?? 1) +
            (config.DerivedFromImprovementCost.offset ?? 0),
        ).join("/"),
      })}`
    }
    case "Fixed":
      return Map.groupBy(
        getAllSelectOptions().map(
          (item): [apValue: number, item: ResolvedSelectOption] => [
            config.Fixed.map.find(mapItem => deepEqual(mapItem.id, item.id))
              ?.ap_value ?? config.Fixed.default,
            item,
          ],
        ),
        item => item[0],
      )
        .entries()
        .map(([apValue, items]): [number, string] => [
          apValue,
          locale.join(
            items
              .map(item => getNameForSelectOptionId(item[1].id))
              .filter(name => name !== undefined)
              .toSorted(locale.compare),
            "conjunction",
          ),
        ])
        .toArray()
        .toSorted(on(item => item[1], locale.compare))
        .map(
          ([apValue, itemNames]) =>
            `${itemNames}: ${locale.translate("{$value} Adventure Points", { value: apValue })}`,
        )
        .join("; ")
    default:
      return assertExhaustive(config)
  }
}

/**
 * Renders an adventure points value to a human-readable string, using the provided locale for translations and formatting. For values that depend on select options or other instances, the necessary lookup functions are provided as arguments.
 */
export const renderAdventurePointsValue = (
  locale: LocaleEnvironment,
  getNameForId: (id: ActivatableIdentifier) => string | undefined,
  getNameForSelectOptionId: (
    id: ResolvedSelectOptionIdentifier,
  ) => string | undefined,
  getAllSelectOptions: () => ResolvedSelectOption[],
  getAllInstances: GetAllInstances<"Script" | "AnimalShapeSize">,
  value: AdventurePointsValue | number,
  entry: BaseActivatable,
  translation: BaseActivatableTranslation,
): string => {
  const { translate, translateMap } = locale
  if (typeof value === "number") {
    return translate(".input {$value :number} {{{$value} Adventure Points}}", {
      value,
    })
  }

  switch (value.kind) {
    case "Fixed": {
      if (entry.levels === undefined) {
        return translate(
          ".input {$value :number} {{{$value} Adventure Points}}",
          { value: value.Fixed },
        )
      } else {
        return translate(
          ".input {$value :number} {{{$value} Adventure Points per level}}",
          { value: value.Fixed },
        )
      }
    }
    case "ByLevel": {
      if (entry.levels !== value.ByLevel.list.length) {
        return MISSING_VALUE
      }

      const mainValue = `${translate("Level {$level}", {
        level: Array.from({ length: entry.levels }, (_, index) =>
          romanize(index + 1),
        ).join("/"),
      })}: ${value.ByLevel.list.join("/")}`

      const { additionalBySizeCategory } = value.ByLevel
      if (additionalBySizeCategory === undefined) {
        return mainValue
      } else {
        const sizeCategories = [
          "tiny",
          "small",
          "medium",
          "large",
          "huge",
        ] as const
        const values = sizeCategories
          .map(sizeCategory => additionalBySizeCategory[sizeCategory])
          .join("/")
        const labels = sizeCategories
          .map(sizeCategory => translate(sizeCategory))
          .join("/")

        return `${mainValue} + ${translate("{$values} AP for size category {$labels} (per level)", { values, labels })}`
      }
    }
    case "DerivedFromSelection": {
      const derivedSelectOptions = entry.select_options?.derived
      if (derivedSelectOptions === undefined) {
        return MISSING_VALUE
      }
      switch (derivedSelectOptions.kind) {
        case "Blessings":
          return MISSING_VALUE
        case "Cantrips":
          return MISSING_VALUE
        case "TradeSecrets":
          return translate("depending on the trade secret")
        case "Scripts":
          return translate("{$value} Adventure Points", {
            value: unique(
              getAllInstances("Script")
                .map(script => script.content.ap_value)
                .filter(apValue => apValue !== undefined),
            )
              .toSorted(numAsc)
              .join("/"),
          })
        case "AnimalShapes": {
          const sizes = getAllInstances("AnimalShapeSize").toSorted(
            on(x => x.content.ap_value, numAsc),
          )
          return translate(
            "{$values} adventure points for a {$sized} animal shape",
            {
              values: sizes.map(size => size.content.ap_value).join("/"),
              sized: sizes
                .map(
                  size =>
                    translateMap(size.content.translations)?.name ??
                    MISSING_VALUE,
                )
                .join("/"),
            },
          )
        }
        case "ArcaneBardTraditions":
          return MISSING_VALUE
        case "ArcaneDancerTraditions":
          return MISSING_VALUE
        case "SexPractices":
          return MISSING_VALUE
        case "Races":
          return MISSING_VALUE
        case "Cultures":
          return MISSING_VALUE
        case "RacesAndCultures":
          return MISSING_VALUE
        case "HomunculusTypes":
          return MISSING_VALUE
        case "BlessedTraditions":
          return MISSING_VALUE
        case "Elements":
          return MISSING_VALUE
        case "Properties":
          return MISSING_VALUE
        case "Aspects":
          return MISSING_VALUE
        case "Diseases":
          if (
            derivedSelectOptions.Diseases.use_half_level_as_ap_value === true
          ) {
            return translate(
              "Half the chosen disease’s level in adventure points",
            )
          } else {
            return translate("The chosen disease’s level in adventure points")
          }
        case "Poisons":
          if (
            derivedSelectOptions.Poisons.use_half_level_as_ap_value === true
          ) {
            return translate(
              "Half the chosen poison’s level in adventure points",
            )
          } else {
            return translate("The chosen poison’s level in adventure points")
          }
        case "Languages":
          return MISSING_VALUE
        case "Skills":
          return renderSelectOptionsAdventurePointsValue(
            locale,
            () => {
              switch (derivedSelectOptions.Skills.categories.length) {
                case 1: {
                  const first = derivedSelectOptions.Skills.categories[0]!
                  switch (first.kind) {
                    case "Skills":
                      return translate("A/B/C/D skill")
                    case "Spells":
                      return translate("A/B/C/D spell")
                    case "Rituals":
                      return translate("A/B/C/D ritual")
                    case "LiturgicalChants":
                      return translate("A/B/C/D liturgical chant")
                    case "Ceremonies":
                      return translate("A/B/C/D ceremony")
                    default:
                      return assertExhaustive(first)
                  }
                }
                case 2:
                  return derivedSelectOptions.Skills.categories.every(
                    category =>
                      category.kind === "Spells" || category.kind === "Rituals",
                  )
                    ? translate("A/B/C/D spellwork")
                    : derivedSelectOptions.Skills.categories.every(
                          category =>
                            category.kind === "LiturgicalChants" ||
                            category.kind === "Ceremonies",
                        )
                      ? translate("A/B/C/D liturgical chant or ceremony")
                      : translate("A/B/C/D ability")

                default:
                  return translate("A/B/C/D ability")
              }
            },
            getAllSelectOptions,
            getNameForSelectOptionId,
            derivedSelectOptions.Skills.ap_value,
          )
        case "CombatTechniques":
          return renderSelectOptionsAdventurePointsValue(
            locale,
            () => translate("B/C/D combat technique"),
            getAllSelectOptions,
            getNameForSelectOptionId,
            derivedSelectOptions.CombatTechniques.ap_value,
          )
        case "TargetCategories":
          return MISSING_VALUE
        default:
          return assertExhaustive(derivedSelectOptions)
      }
    }
    case "DependingOnActive":
      return `${translate(
        ".input {$value :number} {{{$value} Adventure Points}}",
        {
          value: value.DependingOnActive.inactive,
        },
      )} (${translate(
        ".input {$value :number} {{{$value} Adventure Points with {$name}}}",
        {
          value: value.DependingOnActive.active,
          name: getNameForId(value.DependingOnActive.id) ?? MISSING_VALUE,
        },
      )})`
    case "DependingOnActiveInstances":
      switch (value.DependingOnActiveInstances.kind) {
        case "Threshold":
          return translate(
            ".input {$value :number} {{{$value} Adventure Points}}",
            {
              value: value.DependingOnActiveInstances.Threshold.normal,
            },
          )
        case "Expression": {
          const expression = value.DependingOnActiveInstances.Expression
          const values = Array.from(
            { length: entry.maximum ?? 3 },
            (_, index) =>
              evaluateMathOperation(expression, exprValue => {
                switch (exprValue.kind) {
                  case "Constant":
                    return exprValue.Constant
                  case "Active":
                    return index
                  default:
                    return assertExhaustive(exprValue)
                }
              }),
          ).join("/")
          const labels = Array.from(
            { length: entry.maximum ?? 3 },
            (_, index) => `${index + 1}.`,
          ).join("/")

          if (entry.maximum !== undefined) {
            return translate(
              "{$values} Adventure Points for the {$labels} purchase",
              {
                values,
                labels,
              },
            )
          } else {
            return translate(
              "{$values}/and so on Adventure Points for the {$labels}/and so on purchase",
              {
                values,
                labels,
              },
            )
          }
        }
        default:
          return assertExhaustive(value.DependingOnActiveInstances)
      }
    case "Indefinite":
      return translation.ap_value ?? MISSING_VALUE
    default:
      return assertExhaustive(value)
  }
}
