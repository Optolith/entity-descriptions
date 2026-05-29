import type {
  ResolvedSelectOption,
  ResolvedSelectOptionIdentifier,
} from "@optolith/database-schema/cache"
import type {
  ActivatableIdentifier,
  ActivatableNameBuilderRules,
  ActivatablePrerequisite,
  RequirableSelectOptionIdentifier,
} from "@optolith/database-schema/gen"
import type { GetInstanceById } from "../../../../helpers/getTypes.js"
import type { LocaleEnvironment } from "../../../../helpers/locale.js"
import type { LocaleMap, Translate } from "../../../../helpers/translate.js"
import { getNameComponents } from "../../activatableNameChunks.js"
import { printDisplayOption } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Gets a resolved select option by its identifier.
 */
export type GetResolvedSelectOptionById = (
  id: ActivatableIdentifier,
  selectOptionId: ResolvedSelectOptionIdentifier,
) => ResolvedSelectOption | undefined

/**
 * Get the name components of an activatable.
 */
export const printActivatableName = (
  getInstanceById: GetInstanceById<ActivatableIdentifier["kind"] | "Aspect">,
  translate: Translate,
  id: ActivatableIdentifier,
  options: RequirableSelectOptionIdentifier[] | undefined,
  level: number | undefined,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  displayedInProfession: boolean,
) => {
  const entry:
    | {
        nameBuilderRules?: ActivatableNameBuilderRules
        translations: LocaleMap<{ name: string }>
      }
    | undefined = getInstanceById(id)

  if (entry === undefined) {
    return undefined
  }

  return getNameComponents(
    translate,
    id,
    options,
    level,
    entry.nameBuilderRules,
    entry.translations,
    t => t.name,
    getResolvedSelectOptionById,
    displayedInProfession,
  )
}

/**
 * Get the translation of a blessed tradition prerequisite.
 */
export const printActivatablePrerequisite = (
  getInstanceById: GetInstanceById<ActivatableIdentifier["kind"] | "Aspect">,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  locale: Pick<LocaleEnvironment, "translate" | "translateMap">,
  prerequisite: ActivatablePrerequisite,
  displayedInProfession: boolean,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale.translateMap, prerequisite.display_option)
  }

  const nameComponents = printActivatableName(
    getInstanceById,
    locale.translate,
    prerequisite.id,
    prerequisite.options,
    prerequisite.level,
    getResolvedSelectOptionById,
    displayedInProfession,
  )

  if (nameComponents === undefined) {
    return undefined
  }

  return {
    label: `${
      prerequisite.id.kind === "Advantage"
        ? prerequisite.active
          ? locale.translate("advantage")
          : locale.translate("no advantage")
        : prerequisite.id.kind === "Disadvantage"
          ? prerequisite.active
            ? locale.translate("disadvantage")
            : locale.translate("no disadvantage")
          : prerequisite.active
            ? locale.translate("special ability")
            : locale.translate("no special ability")
    } `,
    value: nameComponents,
    sentenceType: undefined,
    isMeta: false,
  }
}
