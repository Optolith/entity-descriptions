import type {
  EnhancementPrerequisite,
  SkillWithEnhancementsIdentifier,
} from "@optolith/database-schema/gen"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import { fromUniformCase } from "tsondb/schema/gen"
import type { GetInstanceById } from "../../../../helpers/getTypes.js"
import type { LocaleEnvironment } from "../../../../helpers/locale.js"
import type { LocaleMap } from "../../../../helpers/translate.js"
import { attributedNameFromInstance } from "../../markdown.js"
import { MISSING_VALUE } from "../../unknown.js"
import type { PrerequisitePart } from "../part.js"

const printLabel = (
  locale: Pick<LocaleEnvironment, "translate">,
  skillId: SkillWithEnhancementsIdentifier,
): string => {
  switch (skillId.kind) {
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
  getInstanceById: GetInstanceById<"Spell" | "Ritual" | "LiturgicalChant" | "Ceremony">,
  parentId: SkillWithEnhancementsIdentifier,
): { translations: LocaleMap<{ name: string }> } | undefined => {
  switch (parentId.kind) {
    case "Spell":
      return getInstanceById("Spell", parentId.Spell)
    case "Ritual":
      return getInstanceById("Ritual", parentId.Ritual)
    case "LiturgicalChant":
      return getInstanceById("LiturgicalChant", parentId.LiturgicalChant)
    case "Ceremony":
      return getInstanceById("Ceremony", parentId.Ceremony)
    default:
      return assertExhaustive(parentId)
  }
}

/**
 * Get the translation of an external enhancement prerequisite.
 */
export const printEnhancementPrerequisite = (
  getInstanceById: GetInstanceById<
    "Spell" | "Ritual" | "LiturgicalChant" | "Ceremony" | "Enhancement"
  >,
  locale: Pick<LocaleEnvironment, "translate" | "translateMap">,
  prerequisite: EnhancementPrerequisite,
): PrerequisitePart | undefined => {
  const enhancement = getInstanceById("Enhancement", prerequisite.id)

  const skill = enhancement && getSkill(getInstanceById, enhancement.parent)

  return {
    label: `${enhancement ? printLabel(locale, enhancement.parent) : MISSING_VALUE} `,
    value: `${
      attributedNameFromInstance(
        locale.translateMap,
        enhancement,
        "prerequisite",
        "Enhancement",
        prerequisite.id,
      ) ?? MISSING_VALUE
    } ${locale.translate("for")} ${
      (enhancement &&
        attributedNameFromInstance(
          locale.translateMap,
          skill,
          "prerequisite",
          enhancement.parent.kind,
          fromUniformCase(enhancement.parent),
        )) ??
      MISSING_VALUE
    }`,
    sentenceType: undefined,
    isMeta: false,
  }
}
