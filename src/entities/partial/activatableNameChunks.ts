import { allSame } from "@elyukai/utils/array/filters"
import { ensureNonEmpty, isNotEmpty } from "@elyukai/utils/array/nonEmpty"
import { deepEqual } from "@elyukai/utils/equality"
import { identity, on } from "@elyukai/utils/function"
import { isNotNullish } from "@elyukai/utils/nullable"
import type {
  ActivatableIdentifier,
  ActivatableNameBuilderRules,
  RequirableSelectOptionIdentifier,
} from "@optolith/database-schema/gen"
import { mapObject } from "@optolith/helpers/object"
import { romanize } from "@optolith/helpers/roman"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type { LocaleMap, Translate, TranslateMap } from "../../helpers/translate.js"
import type { GetResolvedSelectOptionById } from "./prerequisites/single/activatable.js"
import { MISSING_VALUE } from "./unknown.js"

/**
 * Returns the full name of the activatable entry as well as its components.
 */
export type ActivatableNameComponents = {
  id: ActivatableIdentifier
  base: ActivatableNameChunk
  options: ActivatableNameChunk | [ActivatableNameChunk, ActivatableNameChunk] | undefined
  level: number | undefined
  nameBuilderRules: Required<ActivatableNameBuilderRules>
}

/**
 * Returns the full name of the activatable entry as well as its components.
 */
export type CombinedActivatableNameComponents = {
  id: ActivatableIdentifier
  base: ActivatableNameChunk
  options: (ActivatableNameChunk | [ActivatableNameChunk, ActivatableNameChunk])[]
  level: number | undefined
  nameBuilderRules: Required<ActivatableNameBuilderRules>
}

/**
 * A part of the name, which can be a locale map, a string for all locales or a
 * function returning a string.
 */
export type ActivatableNameChunk =
  | LocaleMap<string>
  | string
  | ((translateMap: TranslateMap) => string)

const combineChunks = (
  a: ActivatableNameChunk,
  b: ActivatableNameChunk,
  join: (a: string, b: string) => string,
): ActivatableNameChunk => {
  if (typeof a === "string") {
    if (typeof b === "string") {
      return join(a, b)
    } else if (typeof b === "function") {
      return fs => join(a, b(fs))
    } else if (typeof b === "object") {
      return mapObject(b, bValue => join(a, bValue))
    }
    return b
  } else if (typeof a === "function") {
    if (typeof b === "string") {
      return fs => join(a(fs), b)
    } else if (typeof b === "function") {
      return fs => join(a(fs), b(fs))
    } else if (typeof b === "object") {
      return translateMap => join(a(translateMap), translateMap(b) ?? MISSING_VALUE)
    }
    return b
  } else if (typeof a === "object") {
    if (typeof b === "string") {
      return mapObject(a, aValue => join(aValue, b))
    } else if (typeof b === "function") {
      return translateMap => join(translateMap(a) ?? MISSING_VALUE, b(translateMap))
    } else if (typeof b === "object") {
      const ret: LocaleMap<string> = {}
      for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
        ret[key] = join(a[key] ?? MISSING_VALUE, b[key] ?? MISSING_VALUE)
      }
      return ret
    }
    return b
  }
  return a
}

const combinePair = (pair: [ActivatableNameChunk, ActivatableNameChunk]) =>
  combineChunks(pair[0], pair[1], (a, b) => `${a}: ${b}`)

const normalizeChunks = (
  chunk: ActivatableNameChunk | [ActivatableNameChunk, ActivatableNameChunk],
): ActivatableNameChunk => (Array.isArray(chunk) ? combinePair(chunk) : chunk)

/**
 * Zips multiple name chunks together, separating them with commas. Pairs of chunks are combined with a colon.
 */
const zipChunks = (
  chunks: (ActivatableNameChunk | [ActivatableNameChunk, ActivatableNameChunk])[],
): ActivatableNameChunk =>
  chunks
    .map(normalizeChunks)
    .reduce(
      (acc, chunk) => (acc === "" ? chunk : combineChunks(acc, chunk, (a, b) => `${a}, ${b}`)),
      "",
    )

const renderLevel = (
  formatAsPrerequisite: boolean,
  id: ActivatableIdentifier,
  level: number | undefined,
) =>
  level === undefined
    ? undefined
    : formatAsPrerequisite || id.kind === "Advantage" || id.kind === "Disadvantage" || level === 1
      ? romanize(level)
      : `I–${romanize(level)}`

/**
 * Converts a name chunk to a displayable string.
 */
const renderActivatableNameChunk = (
  translateMap: TranslateMap,
  chunk: ActivatableNameChunk,
): string => {
  if (typeof chunk === "string") {
    return chunk
  } else if (typeof chunk === "function") {
    return chunk(translateMap)
  } else if (typeof chunk === "object") {
    return translateMap(chunk) ?? MISSING_VALUE
  }
  return chunk
}

/**
 * This can be used to render an activatable entry with a selectable level, as it splits the text where the level should be inserted.
 */
export const renderActivatableNameComponentsWithoutLevel = (
  translateMap: TranslateMap,
  components: ActivatableNameComponents,
): [beforeLevel: string, afterLevel?: string] => {
  const { levelPlacement, useParenthesis } = components.nameBuilderRules

  const wrapParens: (text: string) => string = useParenthesis ? str => `(${str})` : identity

  const base = renderActivatableNameChunk(translateMap, components.base)
  const options =
    components.options === undefined
      ? undefined
      : wrapParens(renderActivatableNameChunk(translateMap, normalizeChunks(components.options)))

  switch (levelPlacement.kind) {
    case "BeforeOptions":
      return [base, options]
    case "AfterOptions":
      return [[base, options].filter(isNotNullish).join(" ")]
    default:
      return assertExhaustive(levelPlacement)
  }
}

/**
 * Renders the name components of an activatable entry.
 */
export const renderActivatableNameComponents = (
  translateMap: TranslateMap,
  components: ActivatableNameComponents,
  formatAsPrerequisite: boolean,
): string => {
  const levelText = renderLevel(formatAsPrerequisite, components.id, components.level)

  const [beforeLevel, afterLevel] = renderActivatableNameComponentsWithoutLevel(
    translateMap,
    components,
  )

  return [beforeLevel, levelText, afterLevel].filter(isNotNullish).join(" ")
}

/**
 * Combines multiple name components into a single one when all values except for options are the same, joining options according to the passed function.
 *
 * Returns `undefined` if the components cannot be combined.
 */
export const combineNameComponents = (
  elements: ActivatableNameComponents[],
): CombinedActivatableNameComponents | undefined => {
  if (
    isNotEmpty(elements) &&
    allSame(
      elements,
      on(item => [item.id, item.level], deepEqual),
    )
  ) {
    return {
      ...elements[0],
      options: ensureNonEmpty(elements.map(e => e.options).filter(isNotNullish)) ?? [],
    }
  }

  return undefined
}

/**
 * Renders the name components of an activatable entry, combining multiple options into one string.
 */
export const renderCombinedActivatableNameComponents = (
  translateMap: TranslateMap,
  components: CombinedActivatableNameComponents,
  formatAsPrerequisite: boolean,
  join: (list: string[]) => string = list => list.join(", "),
): string =>
  renderActivatableNameComponents(
    translateMap,
    {
      ...components,
      options: join(
        components.options.map(chunk =>
          renderActivatableNameChunk(translateMap, normalizeChunks(chunk)),
        ),
      ),
    },
    formatAsPrerequisite,
  )

/**
 * Renders the name components of multiple activatable entries.
 */
export const renderMultipleStandaloneActivatableNameComponents = (
  translateMap: TranslateMap,
  components: ActivatableNameComponents[],
  formatAsPrerequisite: boolean,
  join: (list: string[]) => string = list => list.join(", "),
): string =>
  join(
    components.map(item =>
      renderActivatableNameComponents(translateMap, item, formatAsPrerequisite),
    ),
  )

/**
 * Renders the name components of multiple activatable entries, combining parts if possible.
 */
export const renderActivatableNameComponentsCombinedIfPossible = (
  translateMap: TranslateMap,
  components: ActivatableNameComponents[],
  formatAsPrerequisite: boolean,
  join: (list: string[]) => string = list => list.join(", "),
): string => {
  const combined = combineNameComponents(components)
  if (combined === undefined) {
    return renderMultipleStandaloneActivatableNameComponents(
      translateMap,
      components,
      formatAsPrerequisite,
      join,
    )
  } else {
    return renderCombinedActivatableNameComponents(
      translateMap,
      combined,
      formatAsPrerequisite,
      join,
    )
  }
}

// const getEntrySpecificFullName = (
//   getInstanceById: GetInstanceById<"Aspect">,
//   locale: LocaleEnvironment,
//   id: ActivatableIdentifier,
//   base: ActivatableNameChunk,
//   level: number | undefined,
//   printedOptions: ActivatableNameComponents["options"],
// ):
//   | Pick<ActivatableNameComponents, "full" | "fullWithoutLevel" | "level">
//   | undefined => {
//   switch (id.kind) {
//     case "Advantage":
// switch (id.Advantage) {
//   case AdvantageIdentifier.HatredOf: {
//     const [firstOption, ...rest] = printedOptions

//     if (firstOption === undefined || Array.isArray(firstOption)) {
//       return undefined
//     }

//     return combineBaseName(
//       combineChunks(base, firstOption, (a, b) => `${a} ${b}`),
//       level,
//       rest,
//     )
//   }
//   default:
//     return undefined
// }
// case "Disadvantage":
// switch (id.Disadvantage) {
//   case DisadvantageIdentifier.PersonalityFlaw: {
//     const [selection, optionalText, ...rest] = printedOptions

//     if (
//       selection === undefined ||
//       Array.isArray(selection) ||
//       Array.isArray(optionalText)
//     ) {
//       return undefined
//     }

//     return combineBaseName(base, level, [
//       optionalText === undefined ? selection : [selection, optionalText],
//       ...rest,
//     ])
//   }
//   default:
//     return undefined
// }
// case "AdvancedCombatSpecialAbility":
// case "AdvancedKarmaSpecialAbility":
// case "AdvancedMagicalSpecialAbility":
// case "AdvancedSkillSpecialAbility":
// switch (id.AdvancedSkillSpecialAbility) {
// case AdvancedSkillSpecialAbilityIdentifier.Fachwissen: {
//   const [skillId, firstApplicationId, secondApplicationId] = options ?? []
// const aspect =
//   aspectId?.tag === "Aspect"
//     ? getAspectById(aspectId.aspect)
//     : undefined
// const aspectTranslations = locale.translateMap(aspect?.translations)

// if (aspectTranslations === undefined) {
//   return undefined
// }

// return combineBaseName(
//   combineChunks(
//     base,
//     aspectTranslations.master_of_aspect_suffix ??
//       aspectTranslations.name,
//     (a, b) => `${a} ${b}`,
//   ),
//   level,
//   [],
// )
//   const getApp = (
//     getSid: (r: Record<ActiveObjectWithId>) => Maybe<string | number>,
//   ) =>
//     pipe(
//       SA.applications,
//       filter(pipe(AA.prerequisite, isNothing)),
//       find(pipe(AA.id, elemF(getSid(hero_entry)))),
//       fmap(AA.name),
//     )
//   return pipe_(
//     hero_entry,
//     AOWIA.sid,
//     misStringM,
//     bindF(lookupF(SDA.skills(staticData))),
//     bindF(skill =>
//       pipe_(
//         List(getApp(AOWIA.sid2)(skill), getApp(AOWIA.sid3)(skill)),
//         catMaybes,
//         ensure(xs => flength(xs) === 2),
//         fmap(
//           pipe(
//             sortStrings(staticData),
//             formatList("conjunction")(staticData),
//             apps => `${SA.name(skill)}: ${apps}`,
//           ),
//         ),
//       ),
//     ),
//   )
// }

//   default:
//     return undefined
// }
// case "AncestorGlyph":
// case "ArcaneOrbEnchantment":
// case "AttireEnchantment":
// case "Beutelzauber":
// case "BlessedTradition":
// case "BowlEnchantment":
// case "BrawlingSpecialAbility":
// case "CauldronEnchantment":
// case "CeremonialItemSpecialAbility":
// case "ChronicleEnchantment":
// case "CombatSpecialAbility":
// case "CombatStyleSpecialAbility":
// case "CommandSpecialAbility":
// case "DaggerRitual":
// case "FamiliarSpecialAbility":
// case "FatePointSexSpecialAbility":
// case "FatePointSpecialAbility":
// case "FoolsHatEnchantment":
//   return undefined
// case "GeneralSpecialAbility":
//   switch (id.GeneralSpecialAbility) {
// case GeneralSpecialAbilityIdentifier.LanguageSpecialization: {
//   const [languageId, specializationId] = options ?? []

//   const language =
//     languageId?.tag === "Language"
//       ? getLanguageById(languageId.language)
//       : undefined

//   const specializations =
//     language?.specializations?.tag === "Specific"
//       ? language.specializations.specific.list
//       : []

//   const specialization =
//     specializationId?.tag === "General"
//       ? specializations.find(
//           spec => spec.id === specializationId.general,
//         )
//       : undefined

// if (aspectTranslations === undefined) {
//   return undefined
// }

//   return pipe(
//     SDA.specialAbilities,
//     lookup<string>(SpecialAbilityId.Language),
//     bindF(pipe(findSelectOption, thrush(AOWIA.sid(hero_entry)))),
//     bindF(lang =>
//       pipe(
//         AOWIA.sid2,
//         bindF(
//           ifElse<string | number, string>(isString)<Maybe<string>>(
//             Just,
//           )(spec_id =>
//             bind(SOA.specializations(lang))(subscriptF(spec_id - 1)),
//           ),
//         ),
//         fmap(spec => `${SOA.name(lang)}: ${spec}`),
//       )(hero_entry),
//     ),
//   )(staticData)
// }

const renderOptions = (
  displayedInProfession: boolean,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  id: ActivatableIdentifier,
  options: RequirableSelectOptionIdentifier[] | undefined,
): ActivatableNameChunk | [ActivatableNameChunk, ActivatableNameChunk] | undefined => {
  const arr =
    options?.map(optionId => {
      const optTranslations = getResolvedSelectOptionById(id, optionId)?.content.translations
      return optTranslations === undefined
        ? MISSING_VALUE
        : mapObject(optTranslations, t10n =>
            displayedInProfession ? (t10n.name_in_profession ?? t10n.name) : t10n.name,
          )
    }) ?? []

  if (isNotEmpty(arr) && arr.length > 1) {
    const [first, ...rest] = arr
    return [first, zipChunks(rest)]
  }

  return arr[0]
}

/**
 * Gets the name components for an activatable entry.
 */
export const getNameComponents = <T>(
  translate: Translate,
  id: ActivatableIdentifier,
  options: RequirableSelectOptionIdentifier[] | undefined,
  level: number | undefined,
  nameBuilderRules: ActivatableNameBuilderRules | undefined,
  translations: LocaleMap<T>,
  getBaseName: (translation: T) => string,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  displayedInProfession: boolean,
): ActivatableNameComponents => {
  const nameBuilderRulesWithDefaults: Required<ActivatableNameBuilderRules> = {
    levelPlacement: nameBuilderRules?.levelPlacement ?? {
      kind: "AfterOptions",
    },
    useParenthesis: nameBuilderRules?.useParenthesis ?? true,
  }

  const renderedBase = mapObject(translations, getBaseName)
  const renderedOptions = renderOptions(
    displayedInProfession,
    getResolvedSelectOptionById,
    id,
    options,
  )

  const isTradition = id.kind === "MagicalTradition" || id.kind === "BlessedTradition"

  const actualBase = isTradition ? translate("Tradition") : renderedBase
  const actualOptions:
    | ActivatableNameChunk
    | [ActivatableNameChunk, ActivatableNameChunk]
    | undefined = isTradition
    ? renderedOptions === undefined
      ? renderedBase
      : [renderedBase, normalizeChunks(renderedOptions)]
    : renderedOptions

  return {
    id,
    base: actualBase,
    options: actualOptions,
    level,
    nameBuilderRules: nameBuilderRulesWithDefaults,
  }
}
