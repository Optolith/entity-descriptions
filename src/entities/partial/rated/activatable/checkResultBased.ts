import { mapNullableDefault } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type {
  CheckResultArithmetic,
  CheckResultBasedModifier,
  CheckResultValue,
} from "optolith-database-schema/gen"
import { Translate } from "../../../../helpers/translate.js"

const getCheckResultBaseValueTranslation = (
  translate: Translate,
  baseValue: CheckResultValue,
) => {
  switch (baseValue.kind) {
    case "QualityLevels":
      return translate("QL")
    case "SkillPoints":
      return translate("SP")
    default:
      return assertExhaustive(baseValue)
  }
}

const getArithmeticSymbol = (arithmetic: CheckResultArithmetic) => {
  switch (arithmetic.kind) {
    case "Divide":
      return ` / `
    case "Multiply":
      return ` × `
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
 * Returns the value text for a check-result-based parameter of an activatable
 * skill.
 */
export const getCheckResultBasedValueTranslation = (
  translate: Translate,
  value: CheckResultBased,
): string =>
  getCheckResultBaseValueTranslation(translate, value.base) +
  mapNullableDefault(
    value.modifier,
    modifier => getArithmeticSymbol(modifier.arithmetic) + modifier.value,
    "",
  )
