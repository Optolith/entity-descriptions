import type {
  ResolvedSelectOption,
  ResolvedSelectOptionIdentifier,
} from "optolith-database-schema/cache"
import type {
  ActivatableIdentifier,
  ActivatablePrerequisite,
  RequirableSelectOptionIdentifier,
} from "optolith-database-schema/gen"
import { type GetInstanceById } from "../../../../helpers/getTypes.js"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import type { LocaleMap } from "../../../../helpers/translate.js"
import {
  getNameComponents,
  printActivatableNameChunk,
} from "../../activatableNameChunks.js"
import { printDisplayOption } from "../displayOption.js"
import { PrerequisitePart } from "../part.js"

/**
 * Gets a resolved select option by its identifier.
 */
export type GetResolvedSelectOptionById = (
  id: ActivatableIdentifier,
  selectOptionId: ResolvedSelectOptionIdentifier,
) => ResolvedSelectOption | undefined

const printActivatableName = (
  getInstanceById: GetInstanceById<ActivatableIdentifier["kind"] | "Aspect">,
  locale: LocaleEnvironment,
  id: ActivatableIdentifier,
  options: RequirableSelectOptionIdentifier[] | undefined,
  level: number | undefined,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
) => {
  const entry: { translations: LocaleMap<{ name: string }> } | undefined =
    getInstanceById(id)

  if (entry === undefined) {
    return undefined
  }

  return getNameComponents(
    getInstanceById,
    locale,
    id,
    options,
    level,
    entry.translations,
    t => t.name,
    selectOptionId => getResolvedSelectOptionById(id, selectOptionId),
    false,
  )
}

/**
 * Get the translation of a blessed tradition prerequisite.
 */
export const printActivatablePrerequisite = (
  getInstanceById: GetInstanceById<ActivatableIdentifier["kind"] | "Aspect">,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  locale: LocaleEnvironment,
  prerequisite: ActivatablePrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale, prerequisite.display_option)
  }

  const nameComponents = printActivatableName(
    getInstanceById,
    locale,
    prerequisite.id,
    prerequisite.options,
    prerequisite.level,
    getResolvedSelectOptionById,
  )

  if (nameComponents === undefined) {
    return undefined
  }

  return {
    label: `${
      prerequisite.active
        ? locale.translate("special ability")
        : locale.translate("no special ability")
    } `,
    value: printActivatableNameChunk(locale, nameComponents.full),
    sentenceType: undefined,
    isMeta: false,
  }
}
