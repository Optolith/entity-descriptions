import type { SocialStatusPrerequisite } from "optolith-database-schema/gen"
import type { GetInstanceById } from "../../../../helpers/getTypes.js"
import type { LocaleEnvironment } from "../../../../helpers/locale.js"
import { printDisplayOption } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a social status prerequisite.
 */
export const printSocialStatusPrerequisite = (
  getInstanceById: GetInstanceById<"SocialStatus">,
  locale: LocaleEnvironment,
  prerequisite: SocialStatusPrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale.translateMap, prerequisite.display_option)
  }

  const socialStatus = getInstanceById("SocialStatus", prerequisite.id)
  const socialStatusTranslation = locale.translateMap(socialStatus?.translations)

  if (socialStatusTranslation === undefined) {
    return undefined
  }

  return {
    value: `${locale.translate("Social Status {$minStatus} or higher", {
      minStatus: `*${socialStatusTranslation.name}*`,
    })} `,
    sentenceType: undefined,
    isMeta: false,
  }
}
