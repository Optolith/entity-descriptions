import { RacePrerequisite } from "optolith-database-schema/gen"
import { type GetInstanceById } from "../../../../helpers/getTypes.js"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { printDisplayOption } from "../displayOption.js"
import { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a race prerequisite.
 */
export const printRacePrerequisite = (
  getInstanceById: GetInstanceById<"Race">,
  locale: Pick<LocaleEnvironment, "translate" | "translateMap">,
  prerequisite: RacePrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale.translateMap, prerequisite.display_option)
  }

  const race = getInstanceById("Race", prerequisite.id)
  const raceTranslation = locale.translateMap(race?.translations)

  if (raceTranslation === undefined) {
    return undefined
  }

  return {
    label: `${locale.translate("Race")} `,
    value: raceTranslation.name,
    sentenceType: undefined,
    isMeta: false,
  }
}
