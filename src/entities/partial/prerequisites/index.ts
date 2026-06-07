import { isNotEmpty } from "@elyukai/utils/array/nonEmpty"
import { on } from "@elyukai/utils/function"
import { mapNullable } from "@elyukai/utils/nullable"
import type {
  ActivatableIdentifier,
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
  PlainGeneralPrerequisites,
  PlainPrerequisites,
  PrerequisiteForLevel,
  PrerequisiteGroup,
  PrerequisitesDisjunction,
  PrerequisitesElement,
  PrerequisitesForLevels,
  ProfessionPrerequisites,
  PublicationPrerequisites,
  RatedIdentifier,
  SpellworkPrerequisites,
} from "@optolith/database-schema/gen"
import { numAsc } from "@optolith/helpers/compare"
import { isNotNullish } from "@optolith/helpers/nullable"
import { romanize } from "@optolith/helpers/roman"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type { GetAllChildInstancesForParent, GetInstanceById } from "../../../helpers/getTypes.js"
import type { LocaleEnvironment } from "../../../helpers/locale.js"
import type { TranslateMap } from "../../../helpers/translate.js"
import {
  renderActivatableNameComponents,
  renderActivatableNameComponentsCombinedIfPossible,
} from "../activatableNameChunks.js"
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
import type { GetResolvedSelectOptionById } from "./single/activatable.js"

type Prerequisite = { kind: string }

const printPrerequisiteGroup = (
  translateMap: TranslateMap,
  group: PrerequisiteGroup<unknown>,
): PrerequisitePart => ({
  value: translateMap(group.translations)?.text ?? MISSING_VALUE,
  sentenceType: undefined,
  isMeta: false,
})

const printPrerequisitesDisjunction = <T extends Prerequisite>(
  getPrerequisiteTranslation: (prerequisite: T) => PrerequisitePart | undefined,
  locale: Pick<LocaleEnvironment, "translateMap" | "join">,
  disjunction: PrerequisitesDisjunction<T>,
): PrerequisitePart | undefined => {
  if (disjunction.display_option !== undefined) {
    return printDisplayOption(locale.translateMap, disjunction.display_option)
  }

  const { list: disjunctionList } = disjunction
  const [first, ...other] = disjunctionList.map(getPrerequisiteTranslation).filter(isNotNullish)

  if (first === undefined) {
    return undefined
  }

  if (
    disjunctionList.length < 2 ||
    (isNotEmpty(disjunctionList) &&
      disjunctionList.slice(1).every(part => part.kind === disjunctionList[0].kind))
  ) {
    return {
      label: first.label,
      value:
        hasPartValueObject(first) && other.every(hasPartValueObject)
          ? renderActivatableNameComponentsCombinedIfPossible(
              locale.translateMap,
              [first.value, ...other.map(part => part.value)],
              true,
              list => locale.join(list, "disjunction"),
            )
          : locale.join(
              [first, ...other].map(part =>
                typeof part.value === "string"
                  ? part.value
                  : renderActivatableNameComponents(locale.translateMap, part.value, true),
              ),
              "disjunction",
            ),
      sentenceType: undefined,
      isMeta: false,
    }
  }

  return {
    value: locale.join(
      [first, ...other].map(
        part =>
          (part.label ?? "") +
          (typeof part.value === "string"
            ? part.value
            : renderActivatableNameComponents(locale.translateMap, part.value, true)),
      ),
      "disjunction",
    ),
    sentenceType: undefined,
    isMeta: false,
  }
}

/**
 * Print prerequisites element as a string.
 */
const printPrerequisitesElement = <T extends Prerequisite>(
  printPrerequisite: (prerequisite: T) => PrerequisitePart | undefined,
  locale: Pick<LocaleEnvironment, "translateMap" | "join">,
  element: PrerequisitesElement<T>,
): PrerequisitePart | undefined => {
  switch (element.kind) {
    case "Single":
      return printPrerequisite(element.Single)
    case "Disjunction":
      return printPrerequisitesDisjunction(printPrerequisite, locale, element.Disjunction)
    case "Group":
      return printPrerequisiteGroup(locale.translateMap, element.Group)
    default:
      return assertExhaustive(element)
  }
}

/**
 * Print plain prerequisites as a string.
 */
const printPlainPrerequisites = <T extends Prerequisite>(
  printPrerequisite: (prerequisite: T) => PrerequisitePart | undefined,
  locale: Pick<LocaleEnvironment, "translate" | "translateMap" | "compare" | "join">,
  prerequisites: PlainPrerequisites<T>,
): string =>
  joinPrerequisiteParts(
    locale.translate,
    locale.translateMap,
    locale.compare,
    prerequisites
      .map(element =>
        mapNullable(printPrerequisitesElement(printPrerequisite, locale, element), part => ({
          type: element.kind === "Single" ? element.Single.kind : element.kind,
          part,
        })),
      )
      .filter(isNotNullish),
  )

/**
 * Print prerequisite for level as a string.
 */
const printPrerequisiteForLevel = <T extends Prerequisite>(
  printPrerequisite: (prerequisite: T) => PrerequisitePart | undefined,
  locale: LocaleEnvironment,
  value: PrerequisiteForLevel<T>,
) => printPrerequisitesElement(printPrerequisite, locale, value.prerequisite)

/**
 * Print prerequisites for levels as a string.
 */
const printPrerequisitesForLevels = <T extends Prerequisite>(
  printPrerequisite: (prerequisite: T) => PrerequisitePart | undefined,
  locale: LocaleEnvironment,
  value: PrerequisitesForLevels<T>,
  printPreviousLevelPrerequisites?: {
    levels: number
    createPrerequisite: (level: number) => T
  },
  trailingText?: string,
): string => {
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

  const printedParts = [
    ...(hasBasePrerequisites
      ? []
      : [
          `${locale.translate("Level {$level}", {
            level: romanize(1),
          })}: ${locale.translate("none")}`,
        ]),
    ...sortedByLevel.map(([levelNumber, prerequisites]) => {
      const prerequisitesString = joinPrerequisiteParts(
        locale.translate,
        locale.translateMap,
        locale.compare,
        [
          ...prerequisites
            .map(element =>
              mapNullable(printPrerequisiteForLevel(printPrerequisite, locale, element), part => ({
                type:
                  element.prerequisite.kind === "Single"
                    ? element.prerequisite.Single.kind
                    : element.prerequisite.kind,
                part,
              })),
            )
            .filter(isNotNullish),
          ...(levelNumber === 1 && trailingText !== undefined
            ? [
                {
                  type: "trailing",
                  part: { value: trailingText, sentenceType: undefined, isMeta: false },
                },
              ]
            : []),
        ],
      )

      return hasOnlyBasePrerequisites
        ? prerequisitesString
        : `${locale.translate("Level {$level}", {
            level: romanize(levelNumber),
          })}: ${prerequisitesString}`
    }),
  ]

  return printedParts.join("; ")
}

/**
 * Print derived characteristic prerequisites as a string.
 */
export const printDerivedCharacteristicPrerequisites = (
  locale: LocaleEnvironment,
  value: DerivedCharacteristicPrerequisites,
): string =>
  printPlainPrerequisites(
    prerequisite => printDerivedCharacteristicPrerequisiteGroup(locale, prerequisite),
    locale,
    value,
  )

/**
 * Print publication prerequisites as a string.
 */
export const printPublicationPrerequisites = (
  getInstanceById: GetInstanceById<"Publication">,
  locale: LocaleEnvironment,
  value: PublicationPrerequisites,
): string =>
  printPlainPrerequisites(
    prerequisite => printPublicationPrerequisiteGroup(getInstanceById, locale, prerequisite),
    locale,
    value,
  )

/**
 * Print plain general prerequisites as a string.
 */
export const printPlainGeneralPrerequisites = (
  getInstanceById: GetInstanceById<
    | "Race"
    | "Culture"
    | "PactCategory"
    | "PactDomain"
    | "SocialStatus"
    | "State"
    | ActivatableIdentifier["kind"]
    | RatedIdentifier["kind"]
    | "Property"
    | "Aspect"
    | "Enhancement"
    | "PersonalityTrait"
  >,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  locale: LocaleEnvironment,
  value: PlainGeneralPrerequisites,
): string =>
  printPlainPrerequisites(
    prerequisite =>
      printGeneralPrerequisiteGroup(
        getInstanceById,
        getResolvedSelectOptionById,
        locale,
        prerequisite,
      ),
    locale,
    value,
  )

/**
 * Print general prerequisites as a string.
 */
export const printGeneralPrerequisites = (
  getInstanceById: GetInstanceById<
    | "Race"
    | "Culture"
    | "PactCategory"
    | "PactDomain"
    | "SocialStatus"
    | "State"
    | ActivatableIdentifier["kind"]
    | RatedIdentifier["kind"]
    | "Property"
    | "Aspect"
    | "Enhancement"
    | "PersonalityTrait"
  >,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  locale: LocaleEnvironment,
  value: GeneralPrerequisites,
  printPreviousLevelPrerequisites?: {
    id: ActivatableIdentifier
    levels: number
  },
  trailingText?: string,
): string =>
  printPrerequisitesForLevels(
    prerequisite =>
      printGeneralPrerequisiteGroup(
        getInstanceById,
        getResolvedSelectOptionById,
        locale,
        prerequisite,
      ),
    locale,
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
  getInstanceById: GetInstanceById<
    "Race" | "Culture" | ActivatableIdentifier["kind"] | RatedIdentifier["kind"] | "Aspect"
  >,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  locale: Pick<LocaleEnvironment, "translate" | "translateMap" | "compare" | "join">,
  value: ProfessionPrerequisites,
): string =>
  printPlainPrerequisites(
    prerequisite =>
      printProfessionPrerequisiteGroup(
        getInstanceById,
        getResolvedSelectOptionById,
        locale,
        prerequisite,
      ),
    locale,
    value,
  )

/**
 * Print advantage disadvantage prerequisites as a string.
 */
export const printAdvantageDisadvantagePrerequisites = (
  getInstanceById: GetInstanceById<
    | "Race"
    | "Culture"
    | "PactCategory"
    | "PactDomain"
    | "SocialStatus"
    | "State"
    | ActivatableIdentifier["kind"]
    | RatedIdentifier["kind"]
    | "Property"
    | "Aspect"
    | "Enhancement"
    | "PersonalityTrait"
  >,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  locale: LocaleEnvironment,
  value: AdvantageDisadvantagePrerequisites,
  name: string,
  type: "Advantage" | "Disadvantage",
): string =>
  printPrerequisitesForLevels(
    prerequisite =>
      printAdvantageDisadvantagePrerequisiteGroup(
        getInstanceById,
        getResolvedSelectOptionById,
        locale,
        prerequisite,
        name,
        type,
      ),
    locale,
    value,
  )

/**
 * Print arcane tradition prerequisites as a string.
 */
export const printArcaneTraditionPrerequisites = (
  getInstanceById: GetInstanceById<"Culture">,
  locale: LocaleEnvironment,
  value: ArcaneTraditionPrerequisites,
): string =>
  printPlainPrerequisites(
    prerequisite => printArcaneTraditionPrerequisiteGroup(getInstanceById, locale, prerequisite),
    locale,
    value,
  )

/**
 * Print personality trait prerequisites as a string.
 */
export const printPersonalityTraitPrerequisites = (
  getInstanceById: GetInstanceById<"Race" | "Culture" | "PersonalityTrait">,
  locale: LocaleEnvironment,
  value: PersonalityTraitPrerequisites,
): string =>
  printPlainPrerequisites(
    prerequisite => printPersonalityTraitPrerequisiteGroup(getInstanceById, locale, prerequisite),
    locale,
    value,
  )

/**
 * Print spellwork prerequisites as a string.
 */
export const printSpellworkPrerequisites = (
  getInstanceById: GetInstanceById<RatedIdentifier["kind"]>,
  locale: LocaleEnvironment,
  value: SpellworkPrerequisites,
): string =>
  printPlainPrerequisites(
    prerequisite => printSpellworkPrerequisiteGroup(getInstanceById, locale, prerequisite),
    locale,
    value,
  )

/**
 * Print liturgy prerequisites as a string.
 */
export const printLiturgyPrerequisites = (
  locale: LocaleEnvironment,
  value: LiturgyPrerequisites,
): string =>
  printPlainPrerequisites(
    prerequisite => printLiturgyPrerequisiteGroup(locale, prerequisite),
    locale,
    value,
  )

/**
 * Print influence prerequisites as a string.
 */
export const printInfluencePrerequisites = (
  getInstanceById: GetInstanceById<"Influence" | "Race" | ActivatableIdentifier["kind"] | "Aspect">,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  getChildInstancesForInstanceId: GetAllChildInstancesForParent<"ProfessionVersion">,
  locale: LocaleEnvironment,
  value: InfluencePrerequisites,
): string =>
  printPlainPrerequisites(
    prerequisite =>
      printInfluencePrerequisiteGroup(
        getInstanceById,
        getResolvedSelectOptionById,
        getChildInstancesForInstanceId,
        locale,
        prerequisite,
      ),
    locale,
    value,
  )

/**
 * Print language prerequisites as a string.
 */
export const printLanguagePrerequisites = (
  getInstanceById: GetInstanceById<"Race" | ActivatableIdentifier["kind"] | "Aspect">,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  locale: LocaleEnvironment,
  value: LanguagePrerequisites,
): string =>
  printPrerequisitesForLevels(
    prerequisite =>
      printLanguagePrerequisiteGroup(
        getInstanceById,
        getResolvedSelectOptionById,
        locale,
        prerequisite,
      ),
    locale,
    value,
  )

/**
 * Print animist power prerequisites as a string.
 */
export const printAnimistPowerPrerequisites = (
  getInstanceById: GetInstanceById<"AnimistPower">,
  locale: LocaleEnvironment,
  value: AnimistPowerPrerequisites,
): string =>
  printPlainPrerequisites(
    prerequisite => printAnimistPowerPrerequisiteGroup(getInstanceById, locale, prerequisite),
    locale,
    value,
  )

/**
 * Print geode ritual prerequisites as a string.
 */
export const printGeodeRitualPrerequisites = (
  getInstanceById: GetInstanceById<"Influence" | ActivatableIdentifier["kind"] | "Aspect">,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  locale: LocaleEnvironment,
  value: GeodeRitualPrerequisites,
): string =>
  printPlainPrerequisites(
    prerequisite =>
      printGeodeRitualPrerequisiteGroup(
        getInstanceById,
        getResolvedSelectOptionById,
        locale,
        prerequisite,
      ),
    locale,
    value,
  )

/**
 * Print enhancement prerequisites as a string.
 */
export const printEnhancementPrerequisites = (
  getInstanceById: GetInstanceById<RatedIdentifier["kind"] | "Enhancement">,
  locale: Pick<LocaleEnvironment, "translate" | "translateMap" | "compare" | "join">,
  value: EnhancementPrerequisites,
): string =>
  printPlainPrerequisites(
    prerequisite => printEnhancementPrerequisiteGroup(getInstanceById, locale, prerequisite),
    locale,
    value,
  )
