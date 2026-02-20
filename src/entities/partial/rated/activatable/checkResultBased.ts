import { mapNullableDefault } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type {
  CheckResultArithmetic,
  CheckResultBasedModifier,
  CheckResultValue,
} from "optolith-database-schema/gen"
import {
  divisionFormatter,
  multiplicationFormatter,
} from "../../mathOperation.js"
import { translateR, type StdReader } from "../../reader.js"

const renderCheckResultBaseValue = (baseValue: CheckResultValue) => {
  switch (baseValue.kind) {
    case "QualityLevels":
      return translateR("QL")
    case "SkillPoints":
      return translateR("SP")
    default:
      return assertExhaustive(baseValue)
  }
}

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

interface CheckResultBased {
  /**
   * The base value that is derived from the check result.
   */
  base: CheckResultValue

  /**
   * If defined, it modifies the base value.
   */
  modifier?: CheckResultBasedModifier
}

/**
 * Appends the modifier of a check-result-based parameter of an activatable skill to the base value, using the appropriate arithmetic formatter.
 */
export const appendCheckResultModifier = (
  left: string,
  modifier: CheckResultBasedModifier,
) => {
  const formatter = getArithmeticFormatter(modifier.arithmetic)
  return formatter(left, modifier.value)
}

/**
 * Returns the value text for a check-result-based parameter of an activatable
 * skill.
 */
export const renderCheckResultBasedValue = (
  value: CheckResultBased,
): StdReader<string, "t"> =>
  renderCheckResultBaseValue(value.base).map(base =>
    mapNullableDefault(
      value.modifier,
      modifier => appendCheckResultModifier(base, modifier),
      base,
    ),
  )
