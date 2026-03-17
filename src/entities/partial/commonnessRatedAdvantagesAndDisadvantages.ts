import { isNotEmpty } from "@elyukai/utils/array/nonEmpty"
import { mapNullable } from "@elyukai/utils/nullable"
import { Reader } from "@elyukai/utils/reader"
import { ensureNonEmpty } from "@optolith/helpers/array"
import type { CommonnessRatedAdvantageDisadvantage } from "optolith-database-schema/gen"
import type { GetInstanceById } from "../../helpers/getTypes.js"
import type { TranslateMap, TranslationKeysWithoutParams } from "../../helpers/translate.js"
import type { RawDefinitionListEntityDescriptionSectionItem } from "../../index.js"
import { attributedCustomName } from "./markdown.js"
import { parensIf } from "./rated/activatable/parensIf.js"
import type { StdReader } from "./reader.js"
import { MISSING_VALUE } from "./unknown.js"

const renderCommonnessRatedAdvantageOrDisadvantageName = <E extends "Advantage" | "Disadvantage">(
  translateMap: TranslateMap,
  getInstanceById: GetInstanceById<E>,
  entity: E,
  item: CommonnessRatedAdvantageDisadvantage<string>,
): string => {
  const customTranslation = translateMap(item.translations)
  return (
    attributedCustomName(
      translateMap,
      getInstanceById,
      entity,
      translation => {
        const name = translation.name_in_library ?? translation.name
        return customTranslation?.options !== undefined && name.endsWith(")")
          ? `${name.slice(0, -1)}; ${customTranslation.options})`
          : name + parensIf(customTranslation?.options)
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
>(
  entity: E,
  items: CommonnessRatedAdvantageDisadvantage<string>[] | undefined,
): StdReader<string, "t" | "tm" | "lc" | "ibi", E> =>
  Reader.asks(({ translate, translateMap, getInstanceById, localeCompare }) =>
    items === undefined || !isNotEmpty(items)
      ? translate("none")
      : items
          .map(item =>
            renderCommonnessRatedAdvantageOrDisadvantageName(
              translateMap,
              getInstanceById,
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
export const renderCommonnessRatedAdvantagesAndDisadvantages = (
  advantages: CommonnessRatedAdvantageDisadvantage<string>[] | undefined,
  disadvantages: CommonnessRatedAdvantageDisadvantage<string>[] | undefined,
): StdReader<string, "t" | "tm" | "lc" | "ibi", "Advantage" | "Disadvantage"> =>
  Reader.asks(
    ({ translate, translateMap, getInstanceById, localeCompare }) =>
      mapNullable(
        ensureNonEmpty(
          [["Advantage", advantages] as const, ["Disadvantage", disadvantages] as const].flatMap(
            ([entity, items]) =>
              items?.map(item =>
                renderCommonnessRatedAdvantageOrDisadvantageName(
                  translateMap,
                  getInstanceById,
                  entity,
                  item,
                ),
              ) ?? [],
          ),
        ),
        renderedItems => renderedItems.toSorted(localeCompare).join(", "),
      ) ?? translate("none"),
  )

/**
 * Render a value with a possible translation, falling back to explicity rendering the value if no translation is available.
 */
export const renderValueWithPossibleTranslation = <T>(
  label: TranslationKeysWithoutParams,
  value: T,
  renderValue: (value: T) => string,
  valueTranslation: string | undefined,
): StdReader<RawDefinitionListEntityDescriptionSectionItem, "t"> =>
  Reader.asks(
    ({ translate }): RawDefinitionListEntityDescriptionSectionItem => ({
      label: translate(label),
      value: valueTranslation ?? renderValue(value),
    }),
  )
