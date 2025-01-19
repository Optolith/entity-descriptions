import { RacePrerequisite } from "optolith-database-schema/types/prerequisites/single/RacePrerequisite"
import { GetById } from "../../../../helpers/getTypes.js"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { printDisplayOption } from "../displayOption.js"
import { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a race prerequisite.
 */
export const printRacePrerequisite = (
  getRaceById: GetById.Static.Race,
  locale: LocaleEnvironment,
  prerequisite: RacePrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale, prerequisite.display_option)
  }

  const race = getRaceById(prerequisite.id.race)
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
