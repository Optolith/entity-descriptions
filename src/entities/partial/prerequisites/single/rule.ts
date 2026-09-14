import { Reader } from "@elyukai/utils/reader"
import type { RulePrerequisite } from "@optolith/database-schema/gen"
import type { StdReader } from "../../../../env.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a rule prerequisite.
 */
export const printRulePrerequisite = (
  _prerequisite: RulePrerequisite,
): StdReader<PrerequisitePart | undefined, never> => Reader.of(undefined)
