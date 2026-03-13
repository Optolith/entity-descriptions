import type { PublicationPrerequisite } from "optolith-database-schema/gen"
import type { GetInstanceById } from "../../../../helpers/getTypes.js"
import type { LocaleEnvironment } from "../../../../helpers/locale.js"
import { printDisplayOption } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a state prerequisite.
 */
export const printPublicationPrerequisite = (
  getInstanceById: GetInstanceById<"Publication">,
  locale: LocaleEnvironment,
  prerequisite: PublicationPrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale.translateMap, prerequisite.display_option)
  }

  const publication = getInstanceById("Publication", prerequisite.id)
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
