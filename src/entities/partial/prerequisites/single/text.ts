import type { TextPrerequisite } from "optolith-database-schema/gen"
import type { LocaleEnvironment } from "../../../../helpers/locale.js"
import { MISSING_VALUE } from "../../unknown.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a text prerequisite.
 */
export const printTextPrerequisite = (
  locale: LocaleEnvironment,
  prerequisite: TextPrerequisite,
): PrerequisitePart => ({
  value: locale.translateMap(prerequisite.translations)?.text ?? MISSING_VALUE,
  sentenceType: prerequisite.sentence_type,
  isMeta: prerequisite.is_meta ?? false,
})
