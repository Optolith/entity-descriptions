import { RulePrerequisite } from "optolith-database-schema/types/prerequisites/single/RulePrerequisite"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a rule prerequisite.
 */
export const printRulePrerequisite = (
  _locale: LocaleEnvironment,
  _prerequisite: RulePrerequisite,
): PrerequisitePart | undefined => undefined
