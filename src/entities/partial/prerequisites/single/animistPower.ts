import { isNotNullish } from "@optolith/helpers/nullable"
import { romanize } from "@optolith/helpers/roman"
import type { AnimistPowerPrerequisite } from "optolith-database-schema/gen"
import { type GetInstanceById } from "../../../../helpers/getTypes.js"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { printDisplayOption } from "../displayOption.js"
import { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a culture prerequisite.
 */
export const printAnimistPowerPrerequisite = (
  getInstanceById: GetInstanceById<"AnimistPower">,
  locale: LocaleEnvironment,
  prerequisite: AnimistPowerPrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale.translateMap, prerequisite.display_option)
  }

  const animistPower = getInstanceById("AnimistPower", prerequisite.id)

  return {
    value: [
      locale.translateMap(animistPower?.translations)?.name ?? "MISSING_VALUE",
      prerequisite.level === undefined ? undefined : romanize(prerequisite.level),
      prerequisite.value.toString(),
    ]
      .filter(isNotNullish)
      .join(" "),
    sentenceType: undefined,
    isMeta: false,
  }
}
