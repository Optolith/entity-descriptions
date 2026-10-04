import { isNotEmpty } from "@elyukai/utils/array/nonEmpty"
import { nullableToArray } from "@elyukai/utils/nullable"
import { Reader } from "@elyukai/utils/reader"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type {
  CommonnessRatedAdvantageDisadvantage,
  CommonnessRatedAdvantageDisadvantageLevel,
  CommonnessRatedAdvantageDisadvantageTranslation,
  Settings,
} from "@optolith/database-schema/gen"
import { ensureNonEmpty } from "@optolith/helpers/array"
import { Case } from "tsondb/schema/gen"
import type { StdEnv, StdReader } from "../../env.js"
import type { TranslationKeysWithoutParams } from "../../helpers/translate.js"
import type { RawDefinitionListEntityDescriptionSectionItem } from "../../rawEntityDescription.js"
import {
  makeNameBuilderRulesWithDefaults,
  renderCombinedActivatableNameComponents,
  renderNameComponentsOptions,
} from "./activatableNameChunks.js"
import { attributedNameFromText } from "./markdown.js"
import { customNameR, localeSortR, translateMapR, translateR } from "./reader.js"
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

const escapeBrackets = (text: string) => text.replace(/(?<!\\)(?<brace>[[\]])/gu, "\\$1")

const renderOptions = (
  item: CommonnessRatedAdvantageDisadvantage<string>,
  id: Case<"Advantage" | "Disadvantage", string>,
  translation: CommonnessRatedAdvantageDisadvantageTranslation | undefined,
) =>
  translation?.options === undefined
    ? Reader.asks(
        (env: StdEnv<"rso">) =>
          item.options?.map(
            option =>
              renderNameComponentsOptions(true, env.getResolvedSelectOptionById, id, [option]) ??
              MISSING_VALUE,
          ) ?? [],
      )
    : Reader.of([escapeBrackets(translation.options)])

const renderCommonnessRatedAdvantageOrDisadvantageName = <E extends "Advantage" | "Disadvantage">(
  entity: E,
  item: CommonnessRatedAdvantageDisadvantage<string>,
): StdReader<string, "tm" | "lc" | "rso" | "ibi", E> =>
  translateMapR(item.translations).thenW(commonnessItemTranslation =>
    customNameR<E, StdEnv<"tm" | "lc" | "rso">>(
      (translation, instance) => {
        if (commonnessItemTranslation?.full !== undefined) {
          return Reader.of(
            attributedNameFromText(
              escapeBrackets(commonnessItemTranslation.full),
              "commonness",
              entity,
              item.id,
            ),
          )
        }

        const id = Case<"Advantage" | "Disadvantage", string>(entity, item.id)

        const level =
          item.level === undefined
            ? undefined
            : convertCommonnessRatedAdvantageOrDisadvantageLevel(item.level)

        return renderOptions(item, id, commonnessItemTranslation).thenW(options => {
          const name =
            translation.name_in_library !== undefined && options.length === 0
              ? translation.name_in_library
              : translation.name

          return Reader.asks(env =>
            renderCombinedActivatableNameComponents(
              env.translateMap,
              {
                id,
                base: name,
                level,
                nameBuilderRules: makeNameBuilderRulesWithDefaults(instance.nameBuilderRules),
                options,
              },
              false,
              list =>
                [
                  ...list.toSorted(env.localeCompare),
                  ...nullableToArray(commonnessItemTranslation?.note),
                ].join(", "),
              "commonness",
            ),
          )
        })
      },
      entity,
      item.id,
    ).map(name => name ?? MISSING_VALUE),
  )

/**
 * Exclude supernatural base advantages from the negative commonness-rated list.
 */
export const excludeNegativeSupernaturalFromList = (
  settings: Settings,
  negativeAdvantages: CommonnessRatedAdvantageDisadvantage<string>[] | undefined,
): CommonnessRatedAdvantageDisadvantage<string>[] | undefined =>
  negativeAdvantages?.filter(
    adv =>
      adv.id !== settings.supernaturalBaseAdvantages.blessed &&
      adv.id !== settings.supernaturalBaseAdvantages.spellcasters,
  )

/**
 * Get a description for the general negative commonness of supernatural advantages and disadvantages if its base advantages also have a negative commonness rating.
 */
export const appendNegativeSupernaturalWithGeneralNegative = (
  entityName: "Advantage" | "Disadvantage",
  settings: Settings,
  negativeAdvantages: CommonnessRatedAdvantageDisadvantage<string>[] | undefined,
): StdReader<string | undefined, "t"> => {
  const hasBlessed =
    negativeAdvantages?.some(adv => adv.id === settings.supernaturalBaseAdvantages.blessed) ?? false
  const hasSpellcaster =
    negativeAdvantages?.some(adv => adv.id === settings.supernaturalBaseAdvantages.spellcasters) ??
    false

  if (hasBlessed && hasSpellcaster) {
    switch (entityName) {
      case "Advantage":
        return translateR("all magical and Blessed One advantages")
      case "Disadvantage":
        return translateR("all magical and Blessed One disadvantages")
      default:
        return assertExhaustive(entityName)
    }
  }

  if (hasBlessed) {
    switch (entityName) {
      case "Advantage":
        return translateR("all Blessed One advantages")
      case "Disadvantage":
        return translateR("all Blessed One disadvantages")
      default:
        return assertExhaustive(entityName)
    }
  }

  if (hasSpellcaster) {
    switch (entityName) {
      case "Advantage":
        return translateR("all magical advantages")
      case "Disadvantage":
        return translateR("all magical disadvantages")
      default:
        return assertExhaustive(entityName)
    }
  }

  return Reader.of(undefined)
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
  appendedString?: string,
): StdReader<string | T, "tm" | "lc" | "ibi" | "rso", E> =>
  (items === undefined || !isNotEmpty(items)) && appendedString === undefined
    ? Reader.of(emptyString)
    : Reader.traverse(items ?? [], item =>
        renderCommonnessRatedAdvantageOrDisadvantageName(entity, item),
      )
        .thenW(localeSortR)
        .map(names => [...names, ...nullableToArray(appendedString)].join(", "))

/**
 * Render the names of commonness-rated advantages and disadvantages together.
 */
export const renderCommonnessRatedAdvantagesAndDisadvantages = <T extends string | undefined>(
  advantages: CommonnessRatedAdvantageDisadvantage<string>[] | undefined,
  disadvantages: CommonnessRatedAdvantageDisadvantage<string>[] | undefined,
  emptyString: T,
): StdReader<string | T, "tm" | "lc" | "ibi" | "rso", "Advantage" | "Disadvantage"> =>
  Reader.sequence(
    [["Advantage", advantages] as const, ["Disadvantage", disadvantages] as const].map(
      ([entity, items]) =>
        Reader.traverse(items ?? [], item =>
          renderCommonnessRatedAdvantageOrDisadvantageName(entity, item),
        ),
    ),
  )
    .map(items => ensureNonEmpty(items.flat()))
    .thenW((renderedItems): StdReader<string | T, "lc"> =>
      renderedItems === undefined
        ? Reader.of(emptyString)
        : localeSortR(renderedItems).map(sortedItems => sortedItems.join(", ")),
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
  Reader.asks(({ translate }): RawDefinitionListEntityDescriptionSectionItem => ({
    label: translate(label),
    value: /* valueTranslation ?? */ renderValue(value),
  }))
