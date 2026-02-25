import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type { RatedIdentifier, RatedPrerequisite } from "optolith-database-schema/gen"
import { type GetInstanceById } from "../../../../helpers/getTypes.js"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import type { TranslateMap } from "../../../../helpers/translate.js"
import { MISSING_VALUE } from "../../unknown.js"
import { printDisplayOption } from "../displayOption.js"
import { PrerequisitePart } from "../part.js"

const printRatedName = (
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
  translateMap: TranslateMap,
  id: RatedIdentifier,
) => {
  switch (id.kind) {
    case "Attribute":
      return (
        translateMap(getInstanceById("Attribute", id.Attribute)?.translations)?.name ??
        MISSING_VALUE
      )
    case "Skill":
      return translateMap(getInstanceById("Skill", id.Skill)?.translations)?.name ?? MISSING_VALUE
    case "CloseCombatTechnique":
      return (
        translateMap(getInstanceById("CloseCombatTechnique", id.CloseCombatTechnique)?.translations)
          ?.name ?? MISSING_VALUE
      )
    case "RangedCombatTechnique":
      return (
        translateMap(
          getInstanceById("RangedCombatTechnique", id.RangedCombatTechnique)?.translations,
        )?.name ?? MISSING_VALUE
      )
    case "Spell":
      return translateMap(getInstanceById("Spell", id.Spell)?.translations)?.name ?? MISSING_VALUE
    case "Ritual":
      return translateMap(getInstanceById("Ritual", id.Ritual)?.translations)?.name ?? MISSING_VALUE
    case "LiturgicalChant":
      return (
        translateMap(getInstanceById("LiturgicalChant", id.LiturgicalChant)?.translations)?.name ??
        MISSING_VALUE
      )
    case "Ceremony":
      return (
        translateMap(getInstanceById("Ceremony", id.Ceremony)?.translations)?.name ?? MISSING_VALUE
      )
    default:
      return assertExhaustive(id)
  }
}

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

  return {
    value: `${printRatedName(getInstanceById, locale.translateMap, prerequisite.id)} ${prerequisite.value}`,
    sentenceType: undefined,
    isMeta: false,
  }
}
