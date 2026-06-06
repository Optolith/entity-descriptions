import { isNotEmpty } from "@elyukai/utils/array/nonEmpty"
import { mapNullable } from "@elyukai/utils/nullable"
import { Reader } from "@elyukai/utils/reader"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type {
  ActivatableIdentifier,
  CommonnessRatedAdvantageDisadvantage,
  CommonnessRatedAdvantageDisadvantageLevel,
} from "@optolith/database-schema/gen"
import { ensureNonEmpty } from "@optolith/helpers/array"
import { Case } from "tsondb/schema/gen"
import type { GetInstanceById } from "../../helpers/getTypes.js"
import type { TranslateMap, TranslationKeysWithoutParams } from "../../helpers/translate.js"
import type { RawDefinitionListEntityDescriptionSectionItem } from "../../index.js"
import {
  makeNameBuilderRulesWithDefaults,
  renderCombinedActivatableNameComponents,
  renderNameComponentsOptions,
} from "./activatableNameChunks.js"
import { attributedCustomName } from "./markdown.js"
import type { GetResolvedSelectOptionById } from "./prerequisites/single/activatable.js"
import type { StdReader } from "./reader.js"
import { MISSING_VALUE } from "./unknown.js"

const convertCommonnessRatedAdvantageOrDisadvantageLevel = (
  level: CommonnessRatedAdvantageDisadvantageLevel,
): number | [number, number] => {
  switch (level.kind) {
    case "Range":
      return [level.Range.min, level.Range.max]
    case "Constant":
      return level.Constant
    default:
      return assertExhaustive(level)
  }
}

const makeActivatableIdentifierForCommonnessRatedAdvantageOrDisadvantage = (
  entity: "Advantage" | "Disadvantage",
  id: string,
): ActivatableIdentifier => {
  switch (entity) {
    case "Advantage":
      return Case("Advantage", id)
    case "Disadvantage":
      return Case("Disadvantage", id)
    default:
      return assertExhaustive(entity)
  }
}

const renderCommonnessRatedAdvantageOrDisadvantageName = <E extends "Advantage" | "Disadvantage">(
  translateMap: TranslateMap,
  getInstanceById: GetInstanceById<E>,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  entity: E,
  item: CommonnessRatedAdvantageDisadvantage<string>,
): string => {
  const customTranslation = translateMap(item.translations)
  return (
    attributedCustomName(
      translateMap,
      getInstanceById,
      entity,
      (translation, instance) => {
        if (customTranslation?.full !== undefined) {
          return customTranslation.full
        }

        const id = makeActivatableIdentifierForCommonnessRatedAdvantageOrDisadvantage(
          entity,
          item.id,
        )

        const level =
          item.level === undefined
            ? undefined
            : convertCommonnessRatedAdvantageOrDisadvantageLevel(item.level)

        const options =
          customTranslation?.options === undefined
            ? (item.options?.map(
                option =>
                  renderNameComponentsOptions(false, getResolvedSelectOptionById, id, [option]) ??
                  MISSING_VALUE,
              ) ?? [])
            : [customTranslation.options]

        const name =
          translation.name_in_library !== undefined && options.length === 0
            ? translation.name_in_library
            : translation.name

        return renderCombinedActivatableNameComponents(
          translateMap,
          {
            id,
            base: name,
            level,
            nameBuilderRules: makeNameBuilderRulesWithDefaults(instance.nameBuilderRules),
            options,
          },
          false,
        )
      },
      entity,
      item.id,
    ) ?? MISSING_VALUE
  )
}

/**
 * Render the names of either commonness-rated advantages or commonness-rated disadvantages.
 */
export const renderCommonnessRatedAdvantagesOrDisadvantages = <
  E extends "Advantage" | "Disadvantage",
  T extends string | undefined,
>(
  entity: E,
  items: CommonnessRatedAdvantageDisadvantage<string>[] | undefined,
  emptyString: T,
): StdReader<string | T, "tm" | "lc" | "ibi" | "rso", E> =>
  Reader.asks(({ translateMap, getInstanceById, getResolvedSelectOptionById, localeCompare }) =>
    items === undefined || !isNotEmpty(items)
      ? emptyString
      : items
          .map(item =>
            renderCommonnessRatedAdvantageOrDisadvantageName(
              translateMap,
              getInstanceById,
              getResolvedSelectOptionById,
              entity,
              item,
            ),
          )
          .toSorted(localeCompare)
          .join(", "),
  )

/**
 * Render the names of commonness-rated advantages and disadvantages together.
 */
export const renderCommonnessRatedAdvantagesAndDisadvantages = <T extends string | undefined>(
  advantages: CommonnessRatedAdvantageDisadvantage<string>[] | undefined,
  disadvantages: CommonnessRatedAdvantageDisadvantage<string>[] | undefined,
  emptyString: T,
): StdReader<string | T, "tm" | "lc" | "ibi" | "rso", "Advantage" | "Disadvantage"> =>
  Reader.asks(
    ({ translateMap, getInstanceById, getResolvedSelectOptionById, localeCompare }) =>
      mapNullable(
        ensureNonEmpty(
          [["Advantage", advantages] as const, ["Disadvantage", disadvantages] as const].flatMap(
            ([entity, items]) =>
              items?.map(item =>
                renderCommonnessRatedAdvantageOrDisadvantageName(
                  translateMap,
                  getInstanceById,
                  getResolvedSelectOptionById,
                  entity,
                  item,
                ),
              ) ?? [],
          ),
        ),
        renderedItems => renderedItems.toSorted(localeCompare).join(", "),
      ) ?? emptyString,
  )

/**
 * Render a value with a possible translation, falling back to explicity rendering the value if no translation is available.
 */
export const renderValueWithPossibleTranslation = <T>(
  label: TranslationKeysWithoutParams,
  value: T,
  renderValue: (value: T) => string,
  _valueTranslation: string | undefined, // use for debugging purposes to verify whether the translation is correctly generated
): StdReader<RawDefinitionListEntityDescriptionSectionItem, "t"> =>
  Reader.asks(
    ({ translate }): RawDefinitionListEntityDescriptionSectionItem => ({
      label: translate(label),
      value: /* valueTranslation ?? */ renderValue(value),
    }),
  )
