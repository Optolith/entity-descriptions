import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type { MathOperation } from "optolith-database-schema/gen"

/**
 * Render a math operation as a string, using the provided function to render the values.
 */
export const renderMathOperation = <T>(
  operation: MathOperation<T>,
  renderValue: (value: T) => string,
): string => {
  const renderWithParenthesis = (
    op: MathOperation<T>,
    addParenthesisTo: MathOperation<T>["kind"][] = [],
  ): string => {
    const rendered = renderMathOperation(op, renderValue)
    return addParenthesisTo.includes(op.kind) ? `(${rendered})` : rendered
  }

  const renderBinary = (
    [left, right]: [MathOperation<T>, MathOperation<T>],
    options: {
      infix?: string
      postfix?: string
      addParenthesisTo?: MathOperation<T>["kind"][]
      addParenthesisToRight?: MathOperation<T>["kind"][]
    } = {},
  ): string =>
    renderWithParenthesis(left, options.addParenthesisTo) +
    (options.infix ?? "") +
    renderWithParenthesis(
      right,
      options.addParenthesisToRight ?? options.addParenthesisTo,
    ) +
    (options.postfix ?? "")

  switch (operation.kind) {
    case "Value":
      return renderValue(operation.Value)
    case "Addition":
      return renderBinary(operation.Addition, { infix: " + " })
    case "Subtraction":
      return renderBinary(operation.Subtraction, {
        infix: " − ",
        addParenthesisToRight: ["Addition", "Subtraction"],
      })
    case "Multiplication":
      return renderBinary(operation.Multiplication, {
        infix: " × ",
        addParenthesisTo: ["Addition", "Subtraction"],
      })
    case "Division":
      return renderBinary(operation.Division, {
        infix: " / ",
        addParenthesisTo: ["Addition", "Subtraction"],
      })
    case "Exponentiation":
      return renderBinary(operation.Exponentiation, {
        infix: "^",
        postfix: "^",
      })
    default:
      return assertExhaustive(operation)
  }
}

/**
 * Evaluate a math operation, using the provided function to evaluate the values.
 */
export const evaluateMathOperation = <T>(
  operation: MathOperation<T>,
  evaluateValue: (value: T) => number,
): number => {
  switch (operation.kind) {
    case "Value":
      return evaluateValue(operation.Value)
    case "Addition": {
      const [left, right] = operation.Addition
      return (
        evaluateMathOperation(left, evaluateValue) +
        evaluateMathOperation(right, evaluateValue)
      )
    }
    case "Subtraction": {
      const [left, right] = operation.Subtraction
      return (
        evaluateMathOperation(left, evaluateValue) -
        evaluateMathOperation(right, evaluateValue)
      )
    }
    case "Multiplication": {
      const [left, right] = operation.Multiplication
      return (
        evaluateMathOperation(left, evaluateValue) *
        evaluateMathOperation(right, evaluateValue)
      )
    }
    case "Division": {
      const [left, right] = operation.Division
      return (
        evaluateMathOperation(left, evaluateValue) /
        evaluateMathOperation(right, evaluateValue)
      )
    }
    case "Exponentiation": {
      const [left, right] = operation.Exponentiation
      return Math.pow(
        evaluateMathOperation(left, evaluateValue),
        evaluateMathOperation(right, evaluateValue),
      )
    }
    default:
      return assertExhaustive(operation)
  }
}
