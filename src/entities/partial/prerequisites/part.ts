import { groupBy } from "@elyukai/utils/array/groups"
import { deepEqual, equal } from "@elyukai/utils/equality"
import { on } from "@elyukai/utils/function"
import { compareNumber, reduceCompare, type Compare } from "@elyukai/utils/ordering"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type { ActivatableIdentifier, SentenceType } from "optolith-database-schema/gen"
import { fromUniformCase } from "tsondb/schema/gen"
import type { LocaleCompare } from "../../../helpers/locale.js"
import type { Translate, TranslateMap } from "../../../helpers/translate.js"
import {
  renderActivatableNameComponents,
  renderActivatableNameComponentsCombinedIfPossible,
  type ActivatableNameComponents,
} from "../activatableNameChunks.js"
import { attributedInstance } from "../markdown.js"

/**
 * A part of the total list of prerequisites.
 */
export type PrerequisitePart = {
  label?: string
  value: string | ActivatableNameComponents
  sentenceType: SentenceType | undefined
  isMeta: boolean
}

/**
 * Type guard for prerequisite parts with a value object.
 */
export const hasPartValueObject = (
  part: PrerequisitePart,
): part is PrerequisitePart & { value: ActivatableNameComponents } => typeof part.value !== "string"

const countFurtherToCombined = (
  part: PrerequisitePart & { value: ActivatableNameComponents },
  remainingParts: (PrerequisitePart & { value: ActivatableNameComponents })[],
) => {
  const indexHasDifferentBaseValues = remainingParts.findIndex(
    remaining =>
      !(
        part.label === remaining.label &&
        deepEqual(part.value.id, remaining.value.id) &&
        part.value.level === remaining.value.level
      ),
  )

  return indexHasDifferentBaseValues === -1
    ? // if -1 is returned, all remaining parts have the same base values, so we can combine with all of them
      remainingParts.length
    : indexHasDifferentBaseValues
}

const wrapActivatableInAttributedString = (text: string, id: ActivatableIdentifier) =>
  attributedInstance(text, id.kind, fromUniformCase(id), { context: '"prerequisite"' })

const joinAdjacentParts = (
  translateMap: TranslateMap,
  localeCompare: LocaleCompare,
  part: PrerequisitePart & { value: ActivatableNameComponents },
  remainingParts: (PrerequisitePart & { value: ActivatableNameComponents })[],
): [renderedValue: string, furtherIncluded: number] => {
  const valuesWithSameBase = remainingParts.slice(0, countFurtherToCombined(part, remainingParts))

  if (valuesWithSameBase.length > 0) {
    return [
      wrapActivatableInAttributedString(
        renderActivatableNameComponentsCombinedIfPossible(
          translateMap,
          [part.value, ...valuesWithSameBase.map(p => p.value)],
          true,
          list => list.toSorted(localeCompare).join(", "),
        ),
        part.value.id,
      ),
      valuesWithSameBase.length,
    ]
  }

  return [
    wrapActivatableInAttributedString(
      renderActivatableNameComponents(translateMap, part.value, true),
      part.value.id,
    ),
    0,
  ]
}

const appendBySentenceType = (
  previouslyRendered: string,
  currentRendered: string,
  sentenceType: SentenceType | undefined,
  isLast: boolean,
): string => {
  switch (sentenceType?.kind) {
    case "Standalone":
      return `${
        /[.;]$/u.test(previouslyRendered)
          ? `${previouslyRendered.slice(0, -1)}. `
          : `${previouslyRendered}. `
      }${currentRendered}${currentRendered.endsWith(".") ? "" : "."}`
    case "Connected":
      return `${previouslyRendered === "" ? "" : /[.;]$/u.test(previouslyRendered) ? `${previouslyRendered} ` : `${previouslyRendered}; `}${currentRendered}${
        isLast ? "" : ";"
      }`
    case undefined:
      return previouslyRendered === ""
        ? currentRendered
        : `${previouslyRendered}${/[.;]$/u.test(previouslyRendered) ? " " : ", "}${currentRendered}`
    default:
      return assertExhaustive(sentenceType)
  }
}

type ActivatableGroup = "Advantage" | "Disadvantage" | "SpecialAbility"
const activatableKindToGroup = (kind: ActivatableIdentifier["kind"]): ActivatableGroup =>
  kind === "Advantage" ? "Advantage" : kind === "Disadvantage" ? "Disadvantage" : "SpecialAbility"
const activatableGroupOrder: ActivatableGroup[] = ["Advantage", "Disadvantage", "SpecialAbility"]
const sortByActivatableGroup: Compare<ActivatableGroup> = on(
  group => activatableGroupOrder.indexOf(group),
  compareNumber,
)

const sortByActivatableGroupAndName = (
  localeCompare: LocaleCompare,
): Compare<[ActivatableGroup, string]> =>
  reduceCompare(
    on(item => item[0], sortByActivatableGroup),
    on(item => item[1], localeCompare),
  )

const appendPrerequisitePartGroup = (
  previous: string,
  translateMap: TranslateMap,
  localeCompare: LocaleCompare,
  parts: PrerequisitePart[],
  isLast: boolean,
) => {
  if (parts.length === 0) {
    return previous
  } else if (parts.every(hasPartValueObject)) {
    return appendBySentenceType(
      previous,
      parts
        .toSorted(on(part => fromUniformCase(part.value.id), localeCompare))
        .reduce(
          (
            acc: [[ActivatableGroup, string][], number],
            current,
            i,
            arr,
          ): [[ActivatableGroup, string][], number] => {
            if (acc[1] > 0) {
              return [acc[0], acc[1] - 1]
            }

            const [rendered, furtherIncluded] = joinAdjacentParts(
              translateMap,
              localeCompare,
              current,
              arr.slice(i + 1),
            )

            return [
              [
                ...acc[0],
                [activatableKindToGroup(current.value.id.kind), (current.label ?? "") + rendered],
              ],
              furtherIncluded,
            ]
          },
          [[], 0],
        )[0]
        .toSorted(sortByActivatableGroupAndName(localeCompare))
        .map(grouped => grouped[1])
        .join(", "),
      undefined,
      isLast,
    )
  } else {
    return parts.reduce(
      (acc, current, i, arr) =>
        appendBySentenceType(
          acc,
          (current.label ?? "") +
            (typeof current.value === "string"
              ? current.value
              : wrapActivatableInAttributedString(
                  renderActivatableNameComponents(translateMap, current.value, true),
                  current.value.id,
                )),
          current.sentenceType,
          isLast && i === arr.length - 1,
        ),
      previous,
    )
  }
}

/**
 * Join prerequisite parts using their configuration.
 */
export const joinPrerequisiteParts = (
  translate: Translate,
  translateMap: TranslateMap,
  localeCompare: LocaleCompare,
  parts: { type: string; part: PrerequisitePart }[],
): string =>
  groupBy(
    parts,
    on(part => part.type, equal),
  )
    .map(group => ({
      type: group[0].type,
      parts: group.map(groupItem => groupItem.part),
    }))
    .reduce(
      (acc, partGroup, i, arr) =>
        appendPrerequisitePartGroup(
          acc,
          translateMap,
          localeCompare,
          partGroup.parts,
          i === arr.length - 1,
        ),
      parts.every(({ part }) => part.isMeta) ? translate("none") : "",
    )
