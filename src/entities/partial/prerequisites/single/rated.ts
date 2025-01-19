import { assertExhaustive } from "@optolith/helpers/typeSafety"
import { RatedIdentifier } from "optolith-database-schema/types/_IdentifierGroup"
import { RatedPrerequisite } from "optolith-database-schema/types/prerequisites/single/RatedPrerequisite"
import { GetById } from "../../../../helpers/getTypes.js"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { MISSING_VALUE } from "../../unknown.js"
import { printDisplayOption } from "../displayOption.js"
import { PrerequisitePart } from "../part.js"

const printRatedName = (
  getAttributeById: GetById.Static.Attribute,
  getSkillById: GetById.Static.Skill,
  getCloseCombatTechniqueById: GetById.Static.CloseCombatTechnique,
  getRangedCombatTechniqueById: GetById.Static.RangedCombatTechnique,
  getSpellById: GetById.Static.Spell,
  getRitualById: GetById.Static.Ritual,
  getLiturgicalChantById: GetById.Static.LiturgicalChant,
  getCeremonyById: GetById.Static.Ceremony,
  locale: LocaleEnvironment,
  id: RatedIdentifier,
) => {
  switch (id.tag) {
    case "Attribute":
      return (
        locale.translateMap(getAttributeById(id.attribute)?.translations)
          ?.name ?? MISSING_VALUE
      )
    case "Skill":
      return (
        locale.translateMap(getSkillById(id.skill)?.translations)?.name ??
        MISSING_VALUE
      )
    case "CloseCombatTechnique":
      return (
        locale.translateMap(
          getCloseCombatTechniqueById(id.close_combat_technique)?.translations,
        )?.name ?? MISSING_VALUE
      )
    case "RangedCombatTechnique":
      return (
        locale.translateMap(
          getRangedCombatTechniqueById(id.ranged_combat_technique)
            ?.translations,
        )?.name ?? MISSING_VALUE
      )
    case "Spell":
      return (
        locale.translateMap(getSpellById(id.spell)?.translations)?.name ??
        MISSING_VALUE
      )
    case "Ritual":
      return (
        locale.translateMap(getRitualById(id.ritual)?.translations)?.name ??
        MISSING_VALUE
      )
    case "LiturgicalChant":
      return (
        locale.translateMap(
          getLiturgicalChantById(id.liturgical_chant)?.translations,
        )?.name ?? MISSING_VALUE
      )
    case "Ceremony":
      return (
        locale.translateMap(getCeremonyById(id.ceremony)?.translations)?.name ??
        MISSING_VALUE
      )
    default:
      return assertExhaustive(id)
  }
}

/**
 * Get the translation of a blessed tradition prerequisite.
 */
export const printRatedPrerequisite = (
  getAttributeById: GetById.Static.Attribute,
  getSkillById: GetById.Static.Skill,
  getCloseCombatTechniqueById: GetById.Static.CloseCombatTechnique,
  getRangedCombatTechniqueById: GetById.Static.RangedCombatTechnique,
  getSpellById: GetById.Static.Spell,
  getRitualById: GetById.Static.Ritual,
  getLiturgicalChantById: GetById.Static.LiturgicalChant,
  getCeremonyById: GetById.Static.Ceremony,
  locale: LocaleEnvironment,
  prerequisite: RatedPrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale, prerequisite.display_option)
  }

  return {
    value: `${printRatedName(
      getAttributeById,
      getSkillById,
      getCloseCombatTechniqueById,
      getRangedCombatTechniqueById,
      getSpellById,
      getRitualById,
      getLiturgicalChantById,
      getCeremonyById,
      locale,
      prerequisite.id,
    )} ${prerequisite.value}`,
    sentenceType: undefined,
    isMeta: false,
  }
}
