import { SocialStatusPrerequisite } from "optolith-database-schema/types/prerequisites/single/SocialStatusPrerequisite"
import { GetById } from "../../../../helpers/getTypes.js"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { printDisplayOption } from "../displayOption.js"
import { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a social status prerequisite.
 */
export const printSocialStatusPrerequisite = (
  getSocialStatusById: GetById.Static.SocialStatus,
  locale: LocaleEnvironment,
  prerequisite: SocialStatusPrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale, prerequisite.display_option)
  }

  const socialStatus = getSocialStatusById(prerequisite.id.social_status)
  const socialStatusTranslation = locale.translateMap(
    socialStatus?.translations,
  )

  if (socialStatusTranslation === undefined) {
    return undefined
  }

  return {
    label: `${locale.translate("Social Status {0} or higher")} `,
    value: `*${socialStatusTranslation.name}*`,
    sentenceType: undefined,
    isMeta: false,
  }
}
