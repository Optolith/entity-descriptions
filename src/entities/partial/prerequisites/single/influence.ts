import type { InfluencePrerequisite } from "@optolith/database-schema/gen"
import type { GetInstanceById } from "../../../../helpers/getTypes.js"
import type { LocaleEnvironment } from "../../../../helpers/locale.js"
import { MISSING_VALUE } from "../../unknown.js"
import { printDisplayOption } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a culture prerequisite.
 */
export const printInfluencePrerequisite = (
  getInstanceById: GetInstanceById<"Influence">,
  locale: Pick<LocaleEnvironment, "translate" | "translateMap">,
  prerequisite: InfluencePrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale.translateMap, prerequisite.display_option)
  }

  const name =
    locale.translateMap(getInstanceById("Influence", prerequisite.id)?.translations)?.name ??
    MISSING_VALUE

  return {
    value: `${locale.translate("no influence")} ${name}`,
    sentenceType: undefined,
    isMeta: false,
  }
}
