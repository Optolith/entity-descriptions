import { anySameIndices } from "@elyukai/utils/array/filters"
import { ensureNonEmpty, isNotEmpty } from "@elyukai/utils/array/nonEmpty"
import { deepEqual } from "@elyukai/utils/equality"
import { on } from "@elyukai/utils/function"
import { isNotNullish, mapNullable } from "@elyukai/utils/nullable"
import { Reader } from "@elyukai/utils/reader"
import { sign } from "@elyukai/utils/string/number"
import type {
  AttributeAdjustments,
  AutomaticAdvantageDisadvantage,
  CommonnessRatedAdvantageDisadvantage,
  Culture_ID,
  RaceVariant,
  RaceVariantTranslation,
} from "optolith-database-schema/gen"
import { createEntityDescriptionCreator } from "../creator.js"
import type {
  CountInstances,
  GetAllChildInstancesForParent,
  GetInstanceById,
} from "../helpers/getTypes.js"
import type {
  TranslateMap,
  TranslationKeysWithoutParams,
} from "../helpers/translate.js"
import type { RawDefinitionListEntityDescriptionSectionItem } from "../index.js"
import { parensIf } from "./partial/rated/activatable/parensIf.js"
import type { EnvMap, StdReader } from "./partial/reader.js"
import { MISSING_VALUE } from "./partial/unknown.js"

const renderBaseValueItem = (
  label: TranslationKeysWithoutParams,
  value: number,
): StdReader<RawDefinitionListEntityDescriptionSectionItem, "t"> =>
  Reader.asks(
    ({ translate }): RawDefinitionListEntityDescriptionSectionItem => ({
      label: translate(label),
      value: value < 0 ? sign(value) : value.toString(),
    }),
  )

const renderAttributeAdjustmentsItem = (
  totalAttributesCount: number,
  adjustments: AttributeAdjustments,
): StdReader<
  RawDefinitionListEntityDescriptionSectionItem,
  "t" | "tm" | "lj" | "ibi",
  "Attribute"
> =>
  Reader.asks(
    ({
      translate,
      translateMap,
      localeJoin,
      getInstanceById,
    }): RawDefinitionListEntityDescriptionSectionItem => {
      const getAttributeAbbreviation = (id: string) =>
        translateMap(getInstanceById("Attribute", id)?.translations)
          ?.abbreviation ?? MISSING_VALUE
      return {
        label: translate("Attribute Adjustments"),
        value: [
          ...(adjustments.fixed?.map(
            adj => `${getAttributeAbbreviation(adj.id)} ${sign(adj.value)}`,
          ) ?? []),
          ...(adjustments.selectable?.map(
            adj =>
              `${adj.list.length === totalAttributesCount ? translate("one attribute of your choice") : localeJoin(adj.list.map(getAttributeAbbreviation), "disjunction")} ${sign(adj.value)}`,
          ) ?? []),
        ].join("; "),
      }
    },
  )

const renderValueWithPossibleTranslation = <T>(
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

const renderVariantValues = <T>(
  label: TranslationKeysWithoutParams,
  variants: RaceVariant[],
  selector: (variant: RaceVariant) => T,
  renderValue: (value: T) => string,
  translationSelector?: (
    variantTranslation: RaceVariantTranslation,
  ) => string | undefined,
): StdReader<
  RawDefinitionListEntityDescriptionSectionItem,
  "t" | "tm" | "lc" | "lj"
> =>
  Reader.asks(
    ({
      translate,
      translateMap,
      localeCompare,
      localeJoin,
    }): RawDefinitionListEntityDescriptionSectionItem => {
      const values = variants.map(variant => {
        const translation = translateMap(variant.translations)
        return {
          name: translation?.name ?? MISSING_VALUE,
          value: selector(variant),
          valueTranslation:
            translationSelector && translation !== undefined
              ? translationSelector(translation)
              : undefined,
        }
      })

      const sameValues = anySameIndices(
        values,
        on(value => [value.value, value.valueTranslation], deepEqual),
      )

      if (sameValues.length === 1 && sameValues[0]!.length === values.length) {
        return {
          label: translate(label),
          value:
            values[0] === undefined
              ? MISSING_VALUE
              : (values[0].valueTranslation ?? renderValue(values[0].value)),
        }
      } else {
        return {
          label: translate(label),
          value: [
            {
              type: "definitionList",
              style: "nested",
              items: Map.groupBy(
                values
                  .toSorted(on(item => item.name, localeCompare))
                  .map(value => ({
                    label: value.name,
                    value: value.valueTranslation ?? renderValue(value.value),
                  })),
                item => item.value,
              )
                .entries()
                .map(([value, items]) => ({
                  label: localeJoin(
                    items.map(item => item.label),
                    "conjunction",
                  ),
                  value,
                }))
                .toArray(),
            },
          ],
        }
      }
    },
  )

const renderCommonnessRatedAdvantageOrDisadvantageName = <
  E extends "Advantage" | "Disadvantage",
>(
  translateMap: TranslateMap,
  getInstanceById: GetInstanceById<E>,
  entity: E,
  item: CommonnessRatedAdvantageDisadvantage<string>,
): string => {
  const instance = getInstanceById(entity, item.id)
  const instanceTranslation = translateMap(instance?.translations)
  const customTranslation = translateMap(item.translations)
  const name = instanceTranslation?.name_in_library ?? instanceTranslation?.name
  return name !== undefined &&
    customTranslation?.options !== undefined &&
    name.endsWith(")")
    ? `${name.slice(0, -1)}; ${customTranslation.options})`
    : (name ?? MISSING_VALUE) + parensIf(customTranslation?.options)
}

const renderCommonnessRatedAdvantagesOrDisadvantages = <
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

const renderCommonnessRatedAdvantagesAndDisadvantages = (
  advantages: CommonnessRatedAdvantageDisadvantage<string>[] | undefined,
  disadvantages: CommonnessRatedAdvantageDisadvantage<string>[] | undefined,
): StdReader<string, "t" | "tm" | "lc" | "ibi", "Advantage" | "Disadvantage"> =>
  Reader.asks(
    ({ translate, translateMap, getInstanceById, localeCompare }) =>
      mapNullable(
        ensureNonEmpty(
          [
            ["Advantage", advantages] as const,
            ["Disadvantage", disadvantages] as const,
          ].flatMap(
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

const renderAutomaticAdvantagesOrDisadvantages = <
  E extends "Advantage" | "Disadvantage",
  ID extends string,
>(
  entity: E,
  items: AutomaticAdvantageDisadvantage<ID>[] | undefined,
): StdReader<string, "t" | "tm" | "lc" | "ibi", E> =>
  Reader.asks(({ translate, translateMap, getInstanceById, localeCompare }) =>
    items === undefined || !isNotEmpty(items)
      ? translate("none")
      : items
          .map(item => {
            const instanceTranslation = translateMap(
              getInstanceById(entity, item.id)?.translations,
            )
            return (
              instanceTranslation?.name_in_library ??
              instanceTranslation?.name ??
              MISSING_VALUE
            )
          })
          .toSorted(localeCompare)
          .join(", "),
  )

const renderCommonCultures = (
  items: Culture_ID[] | undefined,
): StdReader<string, "t" | "tm" | "lc" | "lj" | "ibi", "Culture"> =>
  Reader.asks(
    ({
      translate,
      translateMap,
      getInstanceById,
      localeCompare,
      localeJoin,
    }) =>
      items === undefined || !isNotEmpty(items)
        ? translate("none")
        : localeJoin(
            items
              .map(
                itemId =>
                  translateMap(getInstanceById("Culture", itemId)?.translations)
                    ?.name,
              )
              .filter(isNotNullish)
              .toSorted(localeCompare),
            "conjunction",
          ),
  )

/**
 * Get a JSON representation of the rules text for a race.
 */
export const getRaceEntityDescription = createEntityDescriptionCreator<
  "Race",
  {
    getInstanceById: GetInstanceById<
      "Publication" | "Attribute" | "Advantage" | "Disadvantage" | "Culture"
    >
    countInstances: CountInstances<"Attribute">
    getChildInstancesForInstanceId: GetAllChildInstancesForParent<"RaceVariant">
  }
>(
  (
    { getInstanceById, countInstances, getChildInstancesForInstanceId },
    { translate, translateMap, join: localeJoin, compare: localeCompare },
    { id, content: entry },
  ) => {
    const translation = translateMap(entry.translations)

    if (translation === undefined) {
      return undefined
    }

    const totalAttributesCount = countInstances("Attribute")

    const raceVariants = getChildInstancesForInstanceId("RaceVariant", id).map(
      variant => variant.content,
    )

    const env = {
      translate,
      translateMap,
      localeJoin,
      localeCompare,
      getInstanceById,
    } satisfies Partial<EnvMap>

    return {
      title: translation.name,
      className: "race",
      body: [
        {
          type: "definitionList",
          items: [
            {
              label: translate("AP Value"),
              value: translate(
                ".input {$value :number} {{{$value} Adventure Points}}",
                { value: entry.ap_value },
              ),
            },
            renderBaseValueItem(
              "Life Point Base Value",
              entry.base_values.life_points,
            ).run(env),
            renderBaseValueItem(
              "Spirit Base Value",
              entry.base_values.spirit,
            ).run(env),
            renderBaseValueItem(
              "Toughness Base Value",
              entry.base_values.toughness,
            ).run(env),
            renderBaseValueItem(
              "Movement Base Value",
              entry.base_values.movement,
            ).run(env),
            renderAttributeAdjustmentsItem(
              totalAttributesCount,
              entry.attribute_adjustments,
            ).run(env),
            renderVariantValues(
              "Common Cultures",
              raceVariants,
              v => v.common_cultures,
              cultures => renderCommonCultures(cultures).run(env),
            ).run(env),
            entry.automatic_advantages === undefined
              ? undefined
              : renderValueWithPossibleTranslation(
                  "Automatic Advantages",
                  entry.automatic_advantages,
                  v =>
                    renderAutomaticAdvantagesOrDisadvantages(
                      "Advantage",
                      v,
                    ).run(env),
                  translation.automatic_advantages,
                ).run(env),
            entry.automatic_disadvantages === undefined
              ? undefined
              : renderValueWithPossibleTranslation(
                  "Automatic Disadvantages",
                  entry.automatic_disadvantages,
                  v =>
                    renderAutomaticAdvantagesOrDisadvantages(
                      "Disadvantage",
                      v,
                    ).run(env),
                  translation.automatic_disadvantages,
                ).run(env),
            entry.strongly_recommended_advantages === undefined &&
            entry.strongly_recommended_disadvantages === undefined
              ? undefined
              : {
                  label: translate(
                    "Strongly recommended Advantages and Disadvantages",
                  ),
                  value: `${translate("The following advantages and disadvantages distinguish Aventurian {$race}. You should choose these advantages and disadvantages. If you don’t want to take them, talk to your GM.", { race: translation.name })} ${renderCommonnessRatedAdvantagesAndDisadvantages(
                    entry.strongly_recommended_advantages,
                    entry.strongly_recommended_disadvantages,
                  ).run(env)}`,
                },
            renderVariantValues(
              "Common Advantages",
              raceVariants,
              v => v.common_advantages,
              advs =>
                renderCommonnessRatedAdvantagesOrDisadvantages(
                  "Advantage",
                  advs,
                ).run(env),
              vt => vt.common_advantages,
            ).run(env),
            renderVariantValues(
              "Common Disadvantages",
              raceVariants,
              v => v.common_disadvantages,
              advs =>
                renderCommonnessRatedAdvantagesOrDisadvantages(
                  "Disadvantage",
                  advs,
                ).run(env),
              vt => vt.common_disadvantages,
            ).run(env),
            renderVariantValues(
              "Uncommon Advantages",
              raceVariants,
              v => v.uncommon_advantages,
              advs =>
                renderCommonnessRatedAdvantagesOrDisadvantages(
                  "Advantage",
                  advs,
                ).run(env),
              vt => vt.uncommon_advantages,
            ).run(env),
            renderVariantValues(
              "Uncommon Disadvantages",
              raceVariants,
              v => v.uncommon_disadvantages,
              advs =>
                renderCommonnessRatedAdvantagesOrDisadvantages(
                  "Disadvantage",
                  advs,
                ).run(env),
              vt => vt.uncommon_disadvantages,
            ).run(env),
          ],
        },
      ],
      errata: translation.errata,
      references: entry.src,
    }
  },
)
