import { PublicationPrerequisite } from "optolith-database-schema/types/prerequisites/single/PublicationPrerequisite"
import { GetById } from "../../../../helpers/getTypes.js"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { printDisplayOption } from "../displayOption.js"
import { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a state prerequisite.
 */
export const printPublicationPrerequisite = (
  getPublicationById: GetById.Static.Publication,
  locale: LocaleEnvironment,
  prerequisite: PublicationPrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale, prerequisite.display_option)
  }

  const publication = getPublicationById(prerequisite.id.publication)
  const publicationTranslation = locale.translateMap(publication?.translations)

  if (publicationTranslation === undefined) {
    return undefined
  }

  return {
    value: publicationTranslation.name,
    sentenceType: undefined,
    isMeta: false,
  }
}
