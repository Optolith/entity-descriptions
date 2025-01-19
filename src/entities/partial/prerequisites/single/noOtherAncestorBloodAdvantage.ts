import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a culture prerequisite.
 */
export const printNoOtherAncestorBloodAdvantagePrerequisite = (
  locale: LocaleEnvironment,
  _prerequisite: Record<string, never>,
): PrerequisitePart | undefined => ({
  value: locale.translate("no other ancestor blood advantage"),
  sentenceType: undefined,
  isMeta: false,
})
