import { Reader } from "@elyukai/utils/reader"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type { TradeSecretAdventurePointsValue } from "@optolith/database-schema/gen"
import { createEntityDescriptionCreator } from "../creator.js"
import type { StdReader } from "../env.js"
import { renderDefaultValueMapLabel, renderValueMap } from "./partial/map.js"
import { evaluateMathOperation } from "./partial/mathOperation.js"
import { printPlainGeneralPrerequisites } from "./partial/prerequisites/index.js"
import { translateR } from "./partial/reader.js"
import { formatAdventurePoints, formatArbitraryAdventurePoints } from "./partial/units/simple.js"

const renderAdventurePointsValue = (
  value: TradeSecretAdventurePointsValue,
): StdReader<string, "t" | "tm" | "rts" | "fn"> => {
  switch (value.kind) {
    case "Fixed": {
      return formatAdventurePoints(value.Fixed)
    }
    case "DependingOnActiveInstances":
      switch (value.DependingOnActiveInstances.kind) {
        case "Threshold":
          return formatAdventurePoints(value.DependingOnActiveInstances.Threshold.normal)
        case "Expression": {
          const { expression, customLabels } = value.DependingOnActiveInstances.Expression
          const values = Array.from(
            {
              length: customLabels === undefined ? 3 : customLabels.options.length,
            },
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
          )

          if (customLabels !== undefined) {
            return renderValueMap(
              customLabels,
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- customLabels.options is guaranteed to have at least as many entries as values
              (_, index) => Reader.of(values[index]!),
              renderDefaultValueMapLabel,
              formatArbitraryAdventurePoints,
            )
          }

          const labels = Array.from({ length: 3 }, (_, index) => `${(index + 1).toFixed()}.`).join(
            "/",
          )

          return translateR(
            "{$values}/and so on Adventure Points for the {$labels}/and so on purchase",
            {
              values: values.join("/"),
              labels,
            },
          )
        }
        default:
          return assertExhaustive(value.DependingOnActiveInstances)
      }
    default:
      return assertExhaustive(value)
  }
}

/**
 * Get a JSON representation of the rules text for a state.
 */
export const getTradeSecretEntityDescription = createEntityDescriptionCreator<"TradeSecret">(
  (_, env, { content: entry }) => {
    const translation = env.translateMap(entry.translations)

    if (translation === undefined) {
      return undefined
    }

    return {
      type: "tabular",
      title: translation.name,
      className: "trade-secret",
      labels: {
        name: translateR("Name"),
        prerequisites: translateR("Prerequisites"),
        apValue: translateR("AP Value"),
      },
      values: {
        name: Reader.of(translation.name),
        prerequisites:
          entry.prerequisites === undefined
            ? translateR("none")
            : printPlainGeneralPrerequisites(entry.prerequisites),
        apValue: renderAdventurePointsValue(entry.ap_value),
      },
      errata: translation.errata,
      references: entry.src,
    }
  },
)
