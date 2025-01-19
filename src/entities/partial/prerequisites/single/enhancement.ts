import { assertExhaustive } from "@optolith/helpers/typeSafety"
import { Enhancements } from "optolith-database-schema/types/_Enhancements"
import { SkillWithEnhancementsIdentifier } from "optolith-database-schema/types/_IdentifierGroup"
import { LocaleMap } from "optolith-database-schema/types/_LocaleMap"
import {
  ExternalEnhancementPrerequisite,
  InternalEnhancementPrerequisite,
} from "optolith-database-schema/types/prerequisites/single/EnhancementPrerequisite"
import { GetById } from "../../../../helpers/getTypes.js"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { printDisplayOption } from "../displayOption.js"
import { PrerequisitePart } from "../part.js"

const printLabel = (
  locale: LocaleEnvironment,
  skillId: SkillWithEnhancementsIdentifier,
): string => {
  switch (skillId.tag) {
    case "Spell":
    case "Ritual":
      return locale.translate("spell enhancement")
    case "LiturgicalChant":
    case "Ceremony":
      return locale.translate("liturgical enhancement")
    default:
      return assertExhaustive(skillId)
  }
}

const getSkill = (
  getSpellById: GetById.Static.Spell,
  getRitualById: GetById.Static.Ritual,
  getLiturgicalChantById: GetById.Static.LiturgicalChant,
  getCeremonyById: GetById.Static.Ceremony,
  parentId: SkillWithEnhancementsIdentifier,
):
  | { translations: LocaleMap<{ name: string }>; enhancements?: Enhancements }
  | undefined => {
  switch (parentId.tag) {
    case "Spell":
      return getSpellById(parentId.spell)
    case "Ritual":
      return getRitualById(parentId.ritual)
    case "LiturgicalChant":
      return getLiturgicalChantById(parentId.liturgical_chant)
    case "Ceremony":
      return getCeremonyById(parentId.ceremony)
    default:
      return assertExhaustive(parentId)
  }
}

/**
 * Get the translation of an external enhancement prerequisite.
 */
export const printExternalEnhancementPrerequisite = (
  getSpellById: GetById.Static.Spell,
  getRitualById: GetById.Static.Ritual,
  getLiturgicalChantById: GetById.Static.LiturgicalChant,
  getCeremonyById: GetById.Static.Ceremony,
  locale: LocaleEnvironment,
  prerequisite: ExternalEnhancementPrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale, prerequisite.display_option)
  }

  const skill = getSkill(
    getSpellById,
    getRitualById,
    getLiturgicalChantById,
    getCeremonyById,
    prerequisite.skill.id,
  )

  const enhancement = skill?.enhancements?.find(
    e => e.id === prerequisite.enhancement.id,
  )

  return {
    label: `${printLabel(locale, prerequisite.skill.id)} `,
    value: `*${
      locale.translateMap(enhancement?.translations)?.name
    }* ${locale.translate("for")} ${
      locale.translateMap(skill?.translations)?.name
    }`,
    sentenceType: undefined,
    isMeta: false,
  }
}

/**
 * Get the translation of an internal enhancement prerequisite.
 */
export const printInternalEnhancementPrerequisite = (
  getSpellById: GetById.Static.Spell,
  getRitualById: GetById.Static.Ritual,
  getLiturgicalChantById: GetById.Static.LiturgicalChant,
  getCeremonyById: GetById.Static.Ceremony,
  locale: LocaleEnvironment,
  prerequisite: InternalEnhancementPrerequisite,
  parentId: SkillWithEnhancementsIdentifier,
): PrerequisitePart | undefined => {
  const skill = getSkill(
    getSpellById,
    getRitualById,
    getLiturgicalChantById,
    getCeremonyById,
    parentId,
  )

  const enhancement = skill?.enhancements?.find(e => e.id === prerequisite.id)

  return {
    label: `${printLabel(locale, parentId)} `,
    value: `*${locale.translateMap(enhancement?.translations)?.name}*`,
    sentenceType: undefined,
    isMeta: false,
  }
}
