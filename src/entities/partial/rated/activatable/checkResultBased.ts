import { Reader } from "@elyukai/utils/reader"
import type {
  CheckResultArithmetic,
  CheckResultBasedModifier,
  ExpressionBasedParameterValue,
} from "@optolith/database-schema/gen"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import {
  divisionFormatter,
  multiplicationFormatter,
  renderMathOperation,
} from "../../mathOperation.js"
import { type StdEnv, type StdReader } from "../../reader.js"

const getArithmeticFormatter = (arithmetic: CheckResultArithmetic) => {
  switch (arithmetic.kind) {
    case "Divide":
      return divisionFormatter
    case "Multiply":
      return multiplicationFormatter
    default:
      return assertExhaustive(arithmetic)
  }
}

/**
 * Appends the modifier of a check-result-based parameter of an activatable skill to the base value, using the appropriate arithmetic formatter.
 */
export const appendCheckResultModifier = (left: string, modifier: CheckResultBasedModifier) => {
  const formatter = getArithmeticFormatter(modifier.arithmetic)
  return formatter(left, modifier.value)
}

/**
 * Renders a value that is based on the result of the skill check, which can
 * either be a simple value or a math operation.
 */
export const renderExpressionBasedParameterValue = (
  value: ExpressionBasedParameterValue,
): StdReader<string | number, "t"> =>
  Reader.asks(({ translate }: StdEnv<"t">) =>
    renderMathOperation(value, expressionValue => {
      switch (expressionValue.kind) {
        case "Constant":
          return expressionValue.Constant
        case "QualityLevels":
          return translate("QL")
        case "SkillPoints":
          return translate("SP")
        case "SkillRating":
          return translate("SR")
        default:
          return assertExhaustive(expressionValue)
      }
    }),
  )
