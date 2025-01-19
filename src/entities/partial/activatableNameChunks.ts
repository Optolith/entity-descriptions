import { mapObject } from "@optolith/helpers/object"
import { romanize } from "@optolith/helpers/roman"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import { ResolvedSelectOption } from "optolith-database-schema/cache/activatableSelectOptions"
import {
  ActivatableIdentifier,
  SelectOptionIdentifier,
} from "optolith-database-schema/types/_IdentifierGroup"
import { LocaleMap } from "optolith-database-schema/types/_LocaleMap"
import { GetById } from "../../helpers/getTypes.js"
import {
  AdvantageIdentifier,
  DisadvantageIdentifier,
  KarmaSpecialAbilityIdentifier,
} from "../../helpers/identifiers.js"
import { LocaleEnvironment } from "../../helpers/locale.js"
import { MISSING_VALUE } from "./unknown.js"

/**
 * Returns the full name of the activatable entry as well as its components.
 */
export type ActivatableNameComponents = {
  full: ActivatableNameChunk
  fullWithoutLevel:
    | ActivatableNameChunk
    | [ActivatableNameChunk, ActivatableNameChunk]
  base: ActivatableNameChunk
  options: (
    | ActivatableNameChunk
    | [ActivatableNameChunk, ActivatableNameChunk]
  )[]
}

/**
 * A part of the name, which can be a locale map, a string for all locales or a
 * function returning a string.
 */
export type ActivatableNameChunk =
  | LocaleMap<string>
  | string
  | ((locale: LocaleEnvironment) => string)

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
      return fs => join(a(fs), fs.translateMap(b) ?? MISSING_VALUE)
    }
    return b
  } else if (typeof a === "object") {
    if (typeof b === "string") {
      return mapObject(a, aValue => join(aValue, b))
    } else if (typeof b === "function") {
      return fs => join(fs.translateMap(a) ?? MISSING_VALUE, b(fs))
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

const mapChunk = (
  chunk: ActivatableNameChunk,
  map: (str: string) => string,
): ActivatableNameChunk => {
  if (typeof chunk === "string") {
    return map(chunk)
  } else if (typeof chunk === "function") {
    return fs => map(chunk(fs))
  } else if (typeof chunk === "object") {
    return mapObject(chunk, chunkValue => map(chunkValue))
  }
  return chunk
}

const zipChunks = (
  chunks: (
    | ActivatableNameChunk
    | [ActivatableNameChunk, ActivatableNameChunk]
  )[],
): ActivatableNameChunk => {
  const withNormalizedPairs = chunks.map(chunk => {
    if (Array.isArray(chunk)) {
      return combineChunks(chunk[0], chunk[1], (a, b) => `${a}: ${b}`)
    }

    return chunk
  })

  return withNormalizedPairs.reduce(
    (acc, chunk) =>
      acc === "" ? chunk : combineChunks(acc, chunk, (a, b) => `${a}, ${b}`),
    "",
  )
}

const combineBaseName = (
  base: ActivatableNameChunk,
  level: number | undefined,
  options: ActivatableNameComponents["options"],
  config: {
    levelPlacement?: "before" | "after"
    useParenthesis?: boolean
  } = {},
): Pick<ActivatableNameComponents, "full" | "fullWithoutLevel"> => {
  const { levelPlacement = "after", useParenthesis = true } = config
  const appendLevel: (str: string) => string =
    level === undefined ? x => x : x => `${x} ${romanize(level)}`

  const wrapParens = (str: string) => `(${str})`

  const appendOptions = useParenthesis
    ? (baseStr: string, optionsStr: string) =>
        optionsStr === "" ? baseStr : `${baseStr} ${wrapParens(optionsStr)}`
    : (baseStr: string, optionsStr: string) =>
        optionsStr === "" ? baseStr : `${baseStr} ${optionsStr}`

  const full = combineChunks(
    base,
    zipChunks(options),
    (() => {
      switch (levelPlacement) {
        case "before":
          return (a, b) => appendOptions(appendLevel(a), b)
        case "after":
          return (a, b) => appendLevel(appendOptions(a, b))
        default:
          return assertExhaustive(levelPlacement)
      }
    })(),
  )

  switch (levelPlacement) {
    case "before":
      return {
        full,
        fullWithoutLevel: [base, mapChunk(zipChunks(options), wrapParens)],
      }
    case "after":
      return {
        full,
        fullWithoutLevel: combineChunks(
          base,
          zipChunks(options),
          appendOptions,
        ),
      }
    default:
      return assertExhaustive(levelPlacement)
  }
}

const getEntrySpecificFullName = (
  getAspectById: GetById.Static.Aspect,
  locale: LocaleEnvironment,
  id: ActivatableIdentifier,
  base: ActivatableNameChunk,
  level: number | undefined,
  options: SelectOptionIdentifier[] | undefined,
  printedOptions: ActivatableNameComponents["options"],
): Pick<ActivatableNameComponents, "full" | "fullWithoutLevel"> | undefined => {
  switch (id.tag) {
    case "Advantage":
      switch (id.advantage) {
        case AdvantageIdentifier.HatredOf: {
          const [firstOption, ...rest] = printedOptions

          if (firstOption === undefined || Array.isArray(firstOption)) {
            return undefined
          }

          return combineBaseName(
            combineChunks(base, firstOption, (a, b) => `${a} ${b}`),
            level,
            rest,
          )
        }
        case AdvantageIdentifier.ImmunityToPoison:
        case AdvantageIdentifier.ImmunityToDisease:
          return combineBaseName(base, level, printedOptions, {
            useParenthesis: false,
          })
        default:
          return undefined
      }
    case "Disadvantage":
      switch (id.disadvantage) {
        case DisadvantageIdentifier.PersonalityFlaw: {
          const [selection, optionalText, ...rest] = printedOptions

          if (
            selection === undefined ||
            Array.isArray(selection) ||
            Array.isArray(optionalText)
          ) {
            return undefined
          }

          return combineBaseName(base, level, [
            optionalText === undefined ? selection : [selection, optionalText],
            ...rest,
          ])
        }
        case DisadvantageIdentifier.AfraidOf:
          return combineBaseName(base, level, printedOptions, {
            useParenthesis: false,
          })
        case DisadvantageIdentifier.Principles:
        case DisadvantageIdentifier.Obligations:
          return combineBaseName(base, level, printedOptions, {
            levelPlacement: "before",
          })
        default:
          return undefined
      }
    case "AdvancedCombatSpecialAbility":
    case "AdvancedKarmaSpecialAbility":
    case "AdvancedMagicalSpecialAbility":
      return undefined
    case "AdvancedSkillSpecialAbility":
      switch (id.advanced_skill_special_ability) {
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

        default:
          return undefined
      }
    case "AncestorGlyph":
    case "ArcaneOrbEnchantment":
    case "AttireEnchantment":
    case "BlessedTradition":
    case "BowlEnchantment":
    case "BrawlingSpecialAbility":
    case "CauldronEnchantment":
    case "CeremonialItemSpecialAbility":
    case "ChronicleEnchantment":
    case "CombatSpecialAbility":
    case "CombatStyleSpecialAbility":
    case "CommandSpecialAbility":
    case "DaggerRitual":
    case "FamiliarSpecialAbility":
    case "FatePointSexSpecialAbility":
    case "FatePointSpecialAbility":
    case "FoolsHatEnchantment":
      return undefined
    case "GeneralSpecialAbility":
      switch (id.general_special_ability) {
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

        default:
          return undefined
      }
    case "InstrumentEnchantment":
      return undefined
    case "KarmaSpecialAbility":
      switch (id.karma_special_ability) {
        case KarmaSpecialAbilityIdentifier.MasterOfAspect: {
          const [aspectId] = options ?? []
          const aspect =
            aspectId?.tag === "Aspect"
              ? getAspectById(aspectId.aspect)
              : undefined
          const aspectTranslations = locale.translateMap(aspect?.translations)

          if (aspectTranslations === undefined) {
            return undefined
          }

          return combineBaseName(
            combineChunks(
              base,
              aspectTranslations.master_of_aspect_suffix ??
                aspectTranslations.name,
              (a, b) => `${a} ${b}`,
            ),
            level,
            [],
          )
        }

        default:
          return undefined
      }
    case "Krallenkettenzauber":
    case "LiturgicalStyleSpecialAbility":
    case "LycantropicGift":
    case "MagicalSign":
    case "MagicalSpecialAbility":
    case "MagicalTradition":
    case "MagicStyleSpecialAbility":
    case "OrbEnchantment":
    case "PactGift":
    case "ProtectiveWardingCircleSpecialAbility":
    case "RingEnchantment":
    case "Sermon":
    case "SexSpecialAbility":
    case "SickleRitual":
    case "SikaryanDrainSpecialAbility":
    case "SkillStyleSpecialAbility":
    case "SpellSwordEnchantment":
    case "StaffEnchantment":
    case "ToyEnchantment":
    case "Trinkhornzauber":
    case "VampiricGift":
    case "Vision":
    case "WandEnchantment":
    case "WeaponEnchantment":
      return undefined
    default:
      return assertExhaustive(id)
  }
}

/**
 * Gets the name components for an activatable entry.
 */
export const getNameComponents = <T>(
  getAspectById: GetById.Static.Aspect,
  locale: LocaleEnvironment,
  id: ActivatableIdentifier,
  options: SelectOptionIdentifier[] | undefined,
  level: number | undefined,
  translations: LocaleMap<T>,
  getBaseName: (translation: T) => string,
  getSelectOptionById: (
    id: SelectOptionIdentifier,
  ) => ResolvedSelectOption | undefined,
  displayedInProfession: boolean,
): ActivatableNameComponents => {
  const base = mapObject(translations, getBaseName)
  const nameOptions: ActivatableNameComponents["options"] = (() => {
    const arr =
      options?.map(optionId => {
        const optTranslations = getSelectOptionById(optionId)?.translations
        return optTranslations === undefined
          ? MISSING_VALUE
          : mapObject(optTranslations, t10n =>
              displayedInProfession
                ? t10n.name_in_profession ?? t10n.name
                : t10n.name,
            )
      }) ?? []

    if (arr.length > 1) {
      const [first, ...rest] = arr
      return [[first!, zipChunks(rest)]]
    }

    return arr
  })()

  return {
    ...(getEntrySpecificFullName(
      getAspectById,
      locale,
      id,
      base,
      level,
      options,
      nameOptions,
    ) ?? combineBaseName(base, level, nameOptions)),
    base,
    options: nameOptions,
  }
}

/**
 * Converts a name chunk to a displayable string.
 */
export const printActivatableNameChunk = (
  locale: LocaleEnvironment,
  chunk: ActivatableNameChunk,
): string => {
  if (typeof chunk === "string") {
    return chunk
  } else if (typeof chunk === "function") {
    return chunk(locale)
  } else if (typeof chunk === "object") {
    return locale.translateMap(chunk) ?? MISSING_VALUE
  }
  return chunk
}
