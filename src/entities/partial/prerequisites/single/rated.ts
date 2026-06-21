import type { RatedPrerequisite } from "@optolith/database-schema/gen"
import { type GetInstanceById } from "../../../../helpers/getTypes.js"
import type { LocaleEnvironment } from "../../../../helpers/locale.js"
import { attributedCustomName } from "../../markdown.js"
import { MISSING_VALUE } from "../../unknown.js"
import { printDisplayOption } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a blessed tradition prerequisite.
 */
export const printRatedPrerequisite = (
  getInstanceById: GetInstanceById<
    | "Attribute"
    | "Skill"
    | "CloseCombatTechnique"
    | "RangedCombatTechnique"
    | "Spell"
    | "Ritual"
    | "LiturgicalChant"
    | "Ceremony"
  >,
  locale: Pick<LocaleEnvironment, "translateMap">,
  prerequisite: RatedPrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale.translateMap, prerequisite.display_option)
  }

  const name =
    attributedCustomName(
      locale.translateMap,
      getInstanceById,
      "prerequisite",
      (t: { name: string; abbreviation?: string }) => t.abbreviation ?? t.name,
      prerequisite.id,
    ) ?? MISSING_VALUE

  return {
    value: prerequisite.value > 0 ? `${name} ${prerequisite.value.toFixed()}` : name,
    sentenceType: undefined,
    isMeta: false,
  }
}
