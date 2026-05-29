import type { MathOperation } from "@optolith/database-schema/gen"
import { assertExhaustive } from "@optolith/helpers/typeSafety"

type UnaryFormatter = (value: string | number) => string
type BinaryFormatter = (left: string | number, right: string | number) => string

const printOperand = (operand: string | number): string =>
  typeof operand === "number" ? operand.toFixed() : operand

/**
 * Typographic formatter for addition.
 */
export const additionFormatter: BinaryFormatter = (left, right) =>
  // eslint-disable-next-line no-irregular-whitespace
  `${printOperand(left)} + ${printOperand(right)}`

/**
 * Typographic formatter for subtraction.
 */
export const subtractionFormatter: BinaryFormatter = (left, right) =>
  // eslint-disable-next-line no-irregular-whitespace
  `${printOperand(left)} − ${printOperand(right)}`
/**
 * Typographic formatter for multiplication.
 */
export const multiplicationFormatter: BinaryFormatter = (left, right) =>
  // eslint-disable-next-line no-irregular-whitespace
  `${printOperand(left)} × ${printOperand(right)}`

/**
 * Typographic formatter for division.
 */
export const divisionFormatter: BinaryFormatter = (left, right) =>
  // eslint-disable-next-line no-irregular-whitespace
  `${printOperand(left)} / ${printOperand(right)}`

/**
 * Typographic formatter for exponentiation. Uses Markdown syntax.
 */
export const exponentiationFormatter: BinaryFormatter = (left, right) =>
  `${printOperand(left)}^${printOperand(right)}^`

/**
 * Typographic formatter for grouping (parentheses).
 */
export const groupFormatter: UnaryFormatter = value => `(${printOperand(value)})`

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
    return addParenthesisTo.includes(op.kind) ? groupFormatter(rendered) : rendered
  }

  const renderBinary = (
    [left, right]: [MathOperation<T>, MathOperation<T>],
    options: {
      formatter: BinaryFormatter
      addParenthesisTo?: MathOperation<T>["kind"][]
      addParenthesisToRight?: MathOperation<T>["kind"][]
    },
  ): string =>
    options.formatter(
      renderWithParenthesis(left, options.addParenthesisTo),
      renderWithParenthesis(right, options.addParenthesisToRight ?? options.addParenthesisTo),
    )

  switch (operation.kind) {
    case "Value":
      return renderValue(operation.Value)
    case "Addition":
      return renderBinary(operation.Addition, { formatter: additionFormatter })
    case "Subtraction":
      return renderBinary(operation.Subtraction, {
        formatter: subtractionFormatter,
        addParenthesisToRight: ["Addition", "Subtraction"],
      })
    case "Multiplication":
      return renderBinary(operation.Multiplication, {
        formatter: multiplicationFormatter,
        addParenthesisTo: ["Addition", "Subtraction"],
      })
    case "Division":
      return renderBinary(operation.Division, {
        formatter: divisionFormatter,
        addParenthesisTo: ["Addition", "Subtraction"],
      })
    case "Exponentiation":
      return renderBinary(operation.Exponentiation, {
        formatter: exponentiationFormatter,
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
        evaluateMathOperation(left, evaluateValue) + evaluateMathOperation(right, evaluateValue)
      )
    }
    case "Subtraction": {
      const [left, right] = operation.Subtraction
      return (
        evaluateMathOperation(left, evaluateValue) - evaluateMathOperation(right, evaluateValue)
      )
    }
    case "Multiplication": {
      const [left, right] = operation.Multiplication
      return (
        evaluateMathOperation(left, evaluateValue) * evaluateMathOperation(right, evaluateValue)
      )
    }
    case "Division": {
      const [left, right] = operation.Division
      return (
        evaluateMathOperation(left, evaluateValue) / evaluateMathOperation(right, evaluateValue)
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
