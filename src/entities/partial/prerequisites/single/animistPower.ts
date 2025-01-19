import { isNotNullish } from "@optolith/helpers/nullable"
import { romanize } from "@optolith/helpers/roman"
import { AnimistPowerPrerequisite } from "optolith-database-schema/types/prerequisites/single/AnimistPowerPrerequisite"
import { GetById } from "../../../../helpers/getTypes.js"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { printDisplayOption } from "../displayOption.js"
import { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a culture prerequisite.
 */
export const printAnimistPowerPrerequisite = (
  getAnimistPowerById: GetById.Static.AnimistPower,
  locale: LocaleEnvironment,
  prerequisite: AnimistPowerPrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale, prerequisite.display_option)
  }

  const animistPower = getAnimistPowerById(prerequisite.id.animist_power)

  return {
    value: [
      locale.translateMap(animistPower?.translations)?.name ?? "MISSING_VALUE",
      prerequisite.level === undefined
        ? undefined
        : romanize(prerequisite.level),
      prerequisite.value.toString(),
    ]
      .filter(isNotNullish)
      .join(" "),
    sentenceType: undefined,
    isMeta: false,
  }
}
