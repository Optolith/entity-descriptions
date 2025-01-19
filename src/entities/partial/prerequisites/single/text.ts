import { TextPrerequisite } from "optolith-database-schema/types/prerequisites/single/TextPrerequisite"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { MISSING_VALUE } from "../../unknown.js"
import { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a text prerequisite.
 */
export const printTextPrerequisite = (
  locale: LocaleEnvironment,
  prerequisite: TextPrerequisite,
): PrerequisitePart => ({
  value: locale.translateMap(prerequisite.translations) ?? MISSING_VALUE,
  sentenceType: prerequisite.sentence_type,
  isMeta: prerequisite.is_meta ?? false,
})
