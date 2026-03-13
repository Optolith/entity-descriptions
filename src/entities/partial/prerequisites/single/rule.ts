import type { RulePrerequisite } from "optolith-database-schema/gen"
import type { LocaleEnvironment } from "../../../../helpers/locale.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a rule prerequisite.
 */
export const printRulePrerequisite = (
  _locale: LocaleEnvironment,
  _prerequisite: RulePrerequisite,
): PrerequisitePart | undefined => undefined
