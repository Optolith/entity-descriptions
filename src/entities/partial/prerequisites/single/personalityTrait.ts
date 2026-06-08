import type { PersonalityTraitPrerequisite } from "@optolith/database-schema/gen"
import type { GetInstanceById } from "../../../../helpers/getTypes.js"
import type { LocaleEnvironment } from "../../../../helpers/locale.js"
import { attributedNameFromSafeTranslation } from "../../markdown.js"
import { printDisplayOption } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a personality trait prerequisite.
 */
export const printPersonalityTraitPrerequisite = (
  getInstanceById: GetInstanceById<"PersonalityTrait">,
  locale: LocaleEnvironment,
  prerequisite: PersonalityTraitPrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale.translateMap, prerequisite.display_option)
  }

  const personalityTrait = getInstanceById("PersonalityTrait", prerequisite.id)
  const personalityTraitTranslation = locale.translateMap(personalityTrait?.translations)

  if (personalityTrait === undefined || personalityTraitTranslation === undefined) {
    return undefined
  }

  const name = `${attributedNameFromSafeTranslation(
    personalityTraitTranslation,
    "prerequisite",
    "PersonalityTrait",
    prerequisite.id,
  )} (${locale.translate("Level {$level}", {
    level: personalityTrait.level,
  })})`

  return {
    value: prerequisite.active
      ? locale.translate("must have {$trait}", {
          trait: name,
        })
      : locale.translate("cannot be chosen at the same time as {$trait}", {
          trait: name,
        }),
    sentenceType: undefined,
    isMeta: false,
  }
}
