import type { LocaleEnvironment } from "../../../../helpers/locale.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a culture prerequisite.
 */
export const printNoOtherAncestorBloodAdvantagePrerequisite = (
  locale: LocaleEnvironment,
): PrerequisitePart | undefined => ({
  value: locale.translate("no other ancestor blood advantage"),
  sentenceType: undefined,
  isMeta: false,
})
