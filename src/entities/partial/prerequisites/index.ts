import { isNotEmpty } from "@elyukai/utils/array/nonEmpty"
import { on } from "@elyukai/utils/function"
import { mapNullable } from "@elyukai/utils/nullable"
import { Reader } from "@elyukai/utils/reader"
import type {
  ActivatableIdentifier,
  AdvantageDisadvantagePrerequisiteGroup,
  AdvantageDisadvantagePrerequisites,
  AnimistPowerPrerequisites,
  ArcaneTraditionPrerequisites,
  DerivedCharacteristicPrerequisites,
  EnhancementPrerequisites,
  GeneralPrerequisiteGroup,
  GeneralPrerequisites,
  GeodeRitualPrerequisites,
  InfluencePrerequisites,
  LanguagePrerequisites,
  LiturgyPrerequisites,
  PersonalityTraitPrerequisites,
  PlainDiffPrerequisites,
  PlainGeneralPrerequisites,
  PlainPrerequisites,
  PrerequisiteDiff,
  PrerequisiteForLevel,
  PrerequisiteGroup,
  PrerequisitesDisjunction,
  PrerequisitesElement,
  PrerequisitesForLevels,
  ProfessionPrerequisites,
  ProfessionVariantPrerequisites,
  PublicationPrerequisites,
  SpellworkPrerequisites,
} from "@optolith/database-schema/gen"
import { numAsc } from "@optolith/helpers/compare"
import { isNotNullish } from "@optolith/helpers/nullable"
import { romanize } from "@optolith/helpers/roman"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type { StdEnv, StdReader } from "../../../env.js"
import type { RawEntityDescriptionBadge } from "../../../index.js"
import {
  renderActivatableNameComponents,
  renderActivatableNameComponentsCombinedIfPossible,
} from "../activatableNameChunks.js"
import { getInstanceByIdR, localeJoinR, translateR } from "../reader.js"
import { MISSING_VALUE } from "../unknown.js"
import { printDisplayOption } from "./displayOption.js"
import { hasPartValueObject, joinPrerequisiteParts, type PrerequisitePart } from "./part.js"
import {
  printAdvantageDisadvantagePrerequisiteGroup,
  printAnimistPowerPrerequisiteGroup,
  printArcaneTraditionPrerequisiteGroup,
  printDerivedCharacteristicPrerequisiteGroup,
  printEnhancementPrerequisiteGroup,
  printGeneralPrerequisiteGroup,
  printGeodeRitualPrerequisiteGroup,
  printInfluencePrerequisiteGroup,
  printLanguagePrerequisiteGroup,
  printLiturgyPrerequisiteGroup,
  printPersonalityTraitPrerequisiteGroup,
  printProfessionPrerequisiteGroup,
  printPublicationPrerequisiteGroup,
  printSpellworkPrerequisiteGroup,
} from "./prerequisiteGroups.js"

type Prerequisite = { kind: string }

const printPrerequisiteGroup = (
  group: PrerequisiteGroup<unknown>,
): StdReader<PrerequisitePart, "tm"> =>
  Reader.asks(env => ({
    value: env.translateMap(group.translations)?.text ?? MISSING_VALUE,
    sentenceType: undefined,
    isMeta: false,
  }))

const printPrerequisitesDisjunction = <T extends Prerequisite, SingleEnv>(
  getPrerequisiteTranslation: (prerequisite: T) => Reader<SingleEnv, PrerequisitePart | undefined>,
  disjunction: PrerequisitesDisjunction<T>,
): Reader<StdEnv<"t" | "tm" | "lc" | "lj"> & SingleEnv, PrerequisitePart | undefined> => {
  if (disjunction.display_option !== undefined) {
    return printDisplayOption(disjunction.display_option)
  }

  const disjunctionList = disjunction.list

  return Reader.traverse(disjunctionList, getPrerequisiteTranslation)
    .map(list => list.filter(isNotNullish))
    .thenW(([first, ...other]) => {
      if (first === undefined) {
        return Reader.of(undefined)
      }

      if (
        disjunctionList.length < 2 ||
        (isNotEmpty(disjunctionList) &&
          disjunctionList.slice(1).every(part => part.kind === disjunctionList[0].kind))
      ) {
        return (
          hasPartValueObject(first) && other.every(hasPartValueObject)
            ? Reader.asks((env: StdEnv<"t" | "tm" | "lj" | "lc">) =>
                renderActivatableNameComponentsCombinedIfPossible(
                  env.translate,
                  env.translateMap,
                  [first.value, ...other.map(part => part.value)],
                  true,
                  list => env.localeJoin(list.toSorted(env.localeCompare), "disjunction"),
                ),
              )
            : Reader.traverse([first, ...other], part =>
                Reader.asks((env: StdEnv<"tm">) =>
                  typeof part.value === "string"
                    ? part.value
                    : renderActivatableNameComponents(env.translateMap, part.value, true),
                ),
              ).thenW(list => localeJoinR(list, "disjunction"))
        ).map(value => ({
          label: first.label,
          value,
          sentenceType: undefined,
          isMeta: false,
        }))
      }

      return Reader.traverse([first, ...other], part =>
        Reader.asks(
          (env: StdEnv<"tm">) =>
            (part.label ?? "") +
            (typeof part.value === "string"
              ? part.value
              : renderActivatableNameComponents(env.translateMap, part.value, true)),
        ),
      )
        .thenW(list => localeJoinR(list, "disjunction"))
        .map(value => ({
          value,
          sentenceType: undefined,
          isMeta: false,
        }))
    })
}

/**
 * Print prerequisites element as a string.
 */
const printPrerequisitesElement = <T extends Prerequisite, SingleEnv>(
  printPrerequisite: (prerequisite: T) => Reader<SingleEnv, PrerequisitePart | undefined>,
  element: PrerequisitesElement<T>,
): Reader<StdEnv<"t" | "tm" | "lc" | "lj"> & SingleEnv, PrerequisitePart | undefined> => {
  switch (element.kind) {
    case "Single":
      return printPrerequisite(element.Single)
    case "Disjunction":
      return printPrerequisitesDisjunction(printPrerequisite, element.Disjunction)
    case "Group":
      return printPrerequisiteGroup(element.Group)
    default:
      return assertExhaustive(element)
  }
}

/**
 * Print plain prerequisites as a string.
 */
const printPlainPrerequisites = <T extends Prerequisite, SingleEnv>(
  printPrerequisite: (prerequisite: T) => Reader<SingleEnv, PrerequisitePart | undefined>,
  prerequisites: PlainPrerequisites<T>,
): Reader<StdEnv<"t" | "tm" | "lc" | "lj"> & SingleEnv, string> =>
  Reader.traverse(prerequisites, element =>
    printPrerequisitesElement(printPrerequisite, element).map(nullablePart =>
      mapNullable(nullablePart, part => ({
        type: element.kind === "Single" ? element.Single.kind : element.kind,
        part,
      })),
    ),
  ).thenW(list => joinPrerequisiteParts(list.filter(isNotNullish)))

const printPrerequisiteDiff = <T extends Prerequisite, R, SingleEnv>(
  printPrerequisite: (prerequisite: T) => Reader<SingleEnv, PrerequisitePart | undefined>,
  map: (element: T, part: PrerequisitePart | undefined) => R,
  element: PrerequisiteDiff<T>,
): Reader<StdEnv<"t"> & SingleEnv, R> => {
  switch (element.kind) {
    case "Add":
      return printPrerequisite(element.Add).map(part => map(element.Add, part))
    case "Remove":
      return printPrerequisite(element.Remove).map(part =>
        map(element.Remove, part === undefined ? undefined : { ...part, isRemoved: true }),
      )
    default:
      return assertExhaustive(element)
  }
}

/**
 * Print plain prerequisites as a string.
 */
const printPlainDiffPrerequisites = <T extends Prerequisite, SingleEnv>(
  printPrerequisite: (prerequisite: T) => Reader<SingleEnv, PrerequisitePart | undefined>,
  prerequisites: PlainDiffPrerequisites<T>,
): Reader<StdEnv<"t" | "tm" | "lc" | "lj"> & SingleEnv, string> =>
  Reader.traverse(prerequisites, diffElement =>
    printPrerequisiteDiff(
      element => printPrerequisitesElement(printPrerequisite, element),
      (element, nullablePart) =>
        mapNullable(nullablePart, part => ({
          type: element.kind === "Single" ? element.Single.kind : element.kind,
          part,
        })),
      diffElement,
    ),
  ).thenW(list => joinPrerequisiteParts(list.filter(isNotNullish)))

/**
 * Print prerequisite for level as a string.
 */
const printPrerequisiteForLevel = <T extends Prerequisite, SingleEnv>(
  printPrerequisite: (prerequisite: T) => Reader<SingleEnv, PrerequisitePart | undefined>,
  value: PrerequisiteForLevel<T>,
) => printPrerequisitesElement(printPrerequisite, value.prerequisite)

/**
 * Print prerequisites for levels as a string.
 */
const printPrerequisitesForLevels = <T extends Prerequisite, SingleEnv>(
  printPrerequisite: (prerequisite: T) => Reader<SingleEnv, PrerequisitePart | undefined>,
  value: PrerequisitesForLevels<T>,
  printPreviousLevelPrerequisites?: {
    levels: number
    createPrerequisite: (level: number) => T
  },
  trailingText?: string,
): Reader<StdEnv<"t" | "tm" | "lc" | "lj"> & SingleEnv, string> => {
  const previousLevelPrerequisites: PrerequisitesForLevels<T> =
    printPreviousLevelPrerequisites === undefined
      ? []
      : Array.from({ length: printPreviousLevelPrerequisites.levels - 1 }, (_, i) => ({
          level: i + 2,
          prerequisite: {
            kind: "Single",
            Single: printPreviousLevelPrerequisites.createPrerequisite(i + 1),
          },
        }))

  const groupedByLevel = Map.groupBy(
    [...value, ...previousLevelPrerequisites],
    prerequisite => prerequisite.level,
  )

  if (trailingText !== undefined && !groupedByLevel.has(1)) {
    groupedByLevel.set(1, [])
  }

  const hasBasePrerequisites = groupedByLevel.has(1)

  const sortedByLevel = groupedByLevel
    .entries()
    .toArray()
    .sort(on(item => item[0], numAsc))

  const hasOnlyBasePrerequisites = groupedByLevel.size === 1 && hasBasePrerequisites

  const printedParts: Reader<StdEnv<"t" | "tm" | "lc" | "lj"> & SingleEnv, string>[] = [
    ...(hasBasePrerequisites
      ? []
      : [
          translateR("Level {$level}", {
            level: romanize(1),
          }).then(levelLabel =>
            translateR("none").map(levelValue => `${levelLabel}: ${levelValue}`),
          ),
        ]),
    ...sortedByLevel.map(([levelNumber, prerequisites]) => {
      const prerequisitesString = Reader.sequence<
        StdEnv<"t" | "tm" | "lc" | "lj"> & SingleEnv,
        {
          type: string
          part: PrerequisitePart
        }[]
      >([
        Reader.traverse(prerequisites, element =>
          printPrerequisiteForLevel(printPrerequisite, element).map(nullablePart =>
            mapNullable(nullablePart, part => ({
              type:
                element.prerequisite.kind === "Single"
                  ? element.prerequisite.Single.kind
                  : element.prerequisite.kind,
              part,
            })),
          ),
        ).map(list => list.filter(isNotNullish)),
        Reader.of(
          levelNumber === 1 && trailingText !== undefined
            ? [
                {
                  type: "trailing",
                  part: { value: trailingText, sentenceType: undefined, isMeta: false },
                },
              ]
            : [],
        ),
      ]).then(list => joinPrerequisiteParts(list.flat()))

      return hasOnlyBasePrerequisites
        ? prerequisitesString
        : prerequisitesString.then(string =>
            translateR("Level {$level}", {
              level: romanize(levelNumber),
            }).map(levelLabel => `${levelLabel}: ${string}`),
          )
    }),
  ]

  return Reader.sequence(printedParts).map(parts => parts.join("; "))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- any is necessary because the type of the function is not assignable to T otherwise
type DeriveEnvF<T extends (...args: any[]) => any> =
  ReturnType<T> extends Reader<infer E, unknown> ? E : never

/**
 * Print derived characteristic prerequisites as a string.
 */
export const printDerivedCharacteristicPrerequisites = (
  value: DerivedCharacteristicPrerequisites,
): Reader<
  DeriveEnvF<typeof printDerivedCharacteristicPrerequisiteGroup> & StdEnv<"lj" | "lc">,
  string
> => printPlainPrerequisites(printDerivedCharacteristicPrerequisiteGroup, value)

/**
 * Print publication prerequisites as a string.
 */
export const printPublicationPrerequisites = (
  value: PublicationPrerequisites,
): Reader<DeriveEnvF<typeof printPublicationPrerequisiteGroup> & StdEnv<"lj" | "lc">, string> =>
  printPlainPrerequisites(printPublicationPrerequisiteGroup, value)

/**
 * Print plain general prerequisites as a string.
 */
export const printPlainGeneralPrerequisites = (
  value: PlainGeneralPrerequisites,
): Reader<DeriveEnvF<typeof printGeneralPrerequisiteGroup>, string> =>
  printPlainPrerequisites(printGeneralPrerequisiteGroup, value)

/**
 * Print general prerequisites as a string.
 */
export const printGeneralPrerequisites = (
  value: GeneralPrerequisites,
  printPreviousLevelPrerequisites?: {
    id: ActivatableIdentifier
    levels: number
  },
  trailingText?: string,
): Reader<DeriveEnvF<typeof printGeneralPrerequisiteGroup>, string> =>
  printPrerequisitesForLevels(
    printGeneralPrerequisiteGroup,
    value,
    printPreviousLevelPrerequisites === undefined
      ? undefined
      : {
          levels: printPreviousLevelPrerequisites.levels,
          createPrerequisite: (level): GeneralPrerequisiteGroup => ({
            kind: "Activatable",
            Activatable: {
              id: printPreviousLevelPrerequisites.id,
              active: true,
              level,
            },
          }),
        },
    trailingText,
  )

/**
 * Print profession prerequisites as a string.
 */
export const printProfessionPrerequisites = (
  value: ProfessionPrerequisites,
): Reader<DeriveEnvF<typeof printProfessionPrerequisiteGroup> & StdEnv<"lj" | "lc">, string> =>
  printPlainPrerequisites(printProfessionPrerequisiteGroup, value)

/**
 * Print profession prerequisites as a string.
 */
export const printProfessionVariantPrerequisites = (
  value: ProfessionVariantPrerequisites,
): Reader<DeriveEnvF<typeof printProfessionPrerequisiteGroup> & StdEnv<"lj" | "lc">, string> =>
  printPlainDiffPrerequisites(printProfessionPrerequisiteGroup, value)

/**
 * Print advantage disadvantage prerequisites as a string.
 */
export const printAdvantageDisadvantagePrerequisites = (
  value: AdvantageDisadvantagePrerequisites,
  name: string,
  type: "Advantage" | "Disadvantage",
): Reader<DeriveEnvF<typeof printAdvantageDisadvantagePrerequisiteGroup>, string> =>
  printPrerequisitesForLevels(
    prerequisite => printAdvantageDisadvantagePrerequisiteGroup(prerequisite, name, type),
    value,
  )

/**
 * Print arcane tradition prerequisites as a string.
 */
export const printArcaneTraditionPrerequisites = (
  value: ArcaneTraditionPrerequisites,
): Reader<DeriveEnvF<typeof printArcaneTraditionPrerequisiteGroup> & StdEnv<"lj" | "lc">, string> =>
  printPlainPrerequisites(printArcaneTraditionPrerequisiteGroup, value)

/**
 * Print personality trait prerequisites as a string.
 */
export const printPersonalityTraitPrerequisites = (
  value: PersonalityTraitPrerequisites,
): Reader<
  DeriveEnvF<typeof printPersonalityTraitPrerequisiteGroup> & StdEnv<"lj" | "lc">,
  string
> => printPlainPrerequisites(printPersonalityTraitPrerequisiteGroup, value)

/**
 * Print spellwork prerequisites as a string.
 */
export const printSpellworkPrerequisites = (
  value: SpellworkPrerequisites,
): Reader<DeriveEnvF<typeof printSpellworkPrerequisiteGroup> & StdEnv<"lj" | "lc">, string> =>
  printPlainPrerequisites(printSpellworkPrerequisiteGroup, value)

/**
 * Print liturgy prerequisites as a string.
 */
export const printLiturgyPrerequisites = (
  value: LiturgyPrerequisites,
): Reader<
  DeriveEnvF<typeof printLiturgyPrerequisiteGroup> & StdEnv<"t" | "tm" | "lj" | "lc">,
  string
> => printPlainPrerequisites(printLiturgyPrerequisiteGroup, value)

/**
 * Print influence prerequisites as a string.
 */
export const printInfluencePrerequisites = (
  value: InfluencePrerequisites,
): Reader<DeriveEnvF<typeof printInfluencePrerequisiteGroup> & StdEnv<"lj" | "lc">, string> =>
  printPlainPrerequisites(printInfluencePrerequisiteGroup, value)

/**
 * Print language prerequisites as a string.
 */
export const printLanguagePrerequisites = (
  value: LanguagePrerequisites,
): Reader<DeriveEnvF<typeof printLanguagePrerequisiteGroup> & StdEnv<"lj" | "lc">, string> =>
  printPrerequisitesForLevels(printLanguagePrerequisiteGroup, value)

/**
 * Print animist power prerequisites as a string.
 */
export const printAnimistPowerPrerequisites = (
  value: AnimistPowerPrerequisites,
): Reader<
  DeriveEnvF<typeof printAnimistPowerPrerequisiteGroup> & StdEnv<"t" | "lj" | "lc">,
  string
> => printPlainPrerequisites(printAnimistPowerPrerequisiteGroup, value)

/**
 * Print geode ritual prerequisites as a string.
 */
export const printGeodeRitualPrerequisites = (
  value: GeodeRitualPrerequisites,
): Reader<DeriveEnvF<typeof printGeodeRitualPrerequisiteGroup> & StdEnv<"lj" | "lc">, string> =>
  printPlainPrerequisites(printGeodeRitualPrerequisiteGroup, value)

/**
 * Print enhancement prerequisites as a string.
 */
export const printEnhancementPrerequisites = (
  value: EnhancementPrerequisites,
): Reader<DeriveEnvF<typeof printEnhancementPrerequisiteGroup> & StdEnv<"lj" | "lc">, string> =>
  printPlainPrerequisites(printEnhancementPrerequisiteGroup, value)

const getDerivedFocusRuleBadgeFromPrerequisite = (
  prerequisite: PrerequisitesElement<
    AdvantageDisadvantagePrerequisiteGroup | GeneralPrerequisiteGroup
  >,
): StdReader<number | undefined, "ibi", "FocusRule"> =>
  prerequisite.kind === "Single" &&
  prerequisite.Single.kind === "Rule" &&
  prerequisite.Single.Rule.id.kind === "FocusRule"
    ? getInstanceByIdR(prerequisite.Single.Rule.id).map(focusRule => focusRule?.level)
    : Reader.of(undefined)

/**
 * Get the focus rule badge from prerequisites.
 */
export const getDerivedFocusRuleBadgeFromPrerequisites = (
  prerequisites:
    AdvantageDisadvantagePrerequisites | GeneralPrerequisites | PlainGeneralPrerequisites,
): StdReader<RawEntityDescriptionBadge | undefined, "ibi", "FocusRule"> =>
  Reader.asks(env => {
    for (const element of prerequisites) {
      const actualPrerequisite =
        "level" in element ? (element.level === 1 ? element.prerequisite : undefined) : element
      if (actualPrerequisite !== undefined) {
        const badge = getDerivedFocusRuleBadgeFromPrerequisite(actualPrerequisite).run(env)
        if (badge !== undefined) {
          return {
            type: "level",
            value: romanize(badge),
          }
        }
      }
    }
    return undefined
  })
