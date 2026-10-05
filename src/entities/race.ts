import { anySameIndices } from "@elyukai/utils/array/filters"
import { ensureNonEmpty, isNotEmpty } from "@elyukai/utils/array/nonEmpty"
import { deepEqual } from "@elyukai/utils/equality"
import { on } from "@elyukai/utils/function"
import { isNotNullish, mapNullable } from "@elyukai/utils/nullable"
import { compareNumber } from "@elyukai/utils/ordering"
import { Reader } from "@elyukai/utils/reader"
import { sign } from "@elyukai/utils/string/number"
import type {
  ActivatableIdentifier,
  AttributeAdjustments,
  AutomaticAdvantageDisadvantage,
  BaseValues,
  Culture_ID,
  RaceVariant,
  RaceVariantTranslation,
  RequirableSelectOptionIdentifier,
  Settings,
} from "@optolith/database-schema/gen"
import { createEntityDescriptionCreator } from "../creator.js"
import type { EnvMap, StdEnv, StdReader } from "../env.js"
import { Case } from "../helpers/enums.js"
import type {
  CountInstances,
  GetAllChildInstancesForParent,
  GetInstanceById,
} from "../helpers/getTypes.js"
import type { TranslationKeysWithoutParams } from "../helpers/translate.js"
import type { RawDefinitionListEntityDescriptionSectionItem } from "../rawEntityDescription.js"
import type { ActivatableNameComponents } from "./partial/activatableNameChunks.js"
import { renderCommonnessRatedAdvantagesOrDisadvantages } from "./partial/commonnessRatedAdvantagesAndDisadvantages.js"
import {
  attributedCustomName,
  attributedName,
  attributedNameFromTranslation,
} from "./partial/markdown.js"
import { joinPrerequisiteParts } from "./partial/prerequisites/part.js"
import {
  printActivatableName,
  type GetResolvedSelectOptionById,
} from "./partial/prerequisites/single/activatable.js"
import {
  getInstanceByIdR,
  localeJoinR,
  localeSortOnR,
  mapNullableR,
  translateMapR,
  translateR,
} from "./partial/reader.js"
import { MISSING_VALUE } from "./partial/unknown.js"

const renderBaseValues = (
  values: BaseValues,
): StdReader<
  RawDefinitionListEntityDescriptionSectionItem[],
  "t" | "tm" | "ibi",
  "DerivedCharacteristic"
> =>
  Reader.traverse(
    Object.entries(values),
    ([id, { value }]): StdReader<
      [index: number, RawDefinitionListEntityDescriptionSectionItem],
      "t" | "tm" | "ibi",
      "DerivedCharacteristic"
    > =>
      getInstanceByIdR("DerivedCharacteristic", id).thenW(derivedCharacteristic =>
        translateMapR(derivedCharacteristic?.translations).thenW(translation =>
          Reader.asks(({ translate }: StdEnv<"t">) => [
            derivedCharacteristic?.position ?? 0,
            {
              label: translate("{$derivedCharacteristic} Base Value", {
                derivedCharacteristic:
                  attributedNameFromTranslation(
                    translation,
                    "base-values",
                    "DerivedCharacteristic",
                    id,
                  ) ?? MISSING_VALUE,
              }),
              value: value < 0 ? sign(value) : value.toFixed(),
            },
          ]),
        ),
      ),
  ).map(items => items.sort(on(item => item[0], compareNumber)).map(item => item[1]))

const renderAttributeAdjustmentsItem = (
  totalAttributesCount: number,
  adjustments: AttributeAdjustments,
): StdReader<string, "t" | "tm" | "lj" | "ibi", "Attribute"> =>
  Reader.asks(({ translate, translateMap, localeJoin, getInstanceById }): string => {
    const getAttributeAbbreviation = (id: string) =>
      attributedCustomName(
        translateMap,
        getInstanceById,
        "race",
        t => t.abbreviation,
        "Attribute",
        id,
      ) ?? MISSING_VALUE
    return [
      ...(adjustments.fixed?.map(adj => `${getAttributeAbbreviation(adj.id)} ${sign(adj.value)}`) ??
        []),
      ...(adjustments.selectable?.map(
        adj =>
          `${adj.list.length === totalAttributesCount ? translate("one attribute of your choice") : localeJoin(adj.list.map(getAttributeAbbreviation), "disjunction")} ${sign(adj.value)}`,
      ) ?? []),
    ].join("; ")
  })

const renderVariantValues = <T, ER>(
  label: TranslationKeysWithoutParams,
  variants: RaceVariant[],
  selector: (variant: RaceVariant) => T,
  renderValue: (value: T, isSplit: boolean) => Reader<ER, string | undefined>,
  translationSelector?: (variantTranslation: RaceVariantTranslation) => string | undefined,
  allowEmpty = false,
  textPrefix?: string,
): Reader<
  StdEnv<"t" | "tm" | "lc" | "lj"> & ER,
  RawDefinitionListEntityDescriptionSectionItem | undefined
> =>
  Reader.traverse(variants, variant =>
    translateMapR(variant.translations).map(translation => ({
      name: translation?.name ?? MISSING_VALUE,
      value: selector(variant),
      valueTranslation:
        translationSelector && translation !== undefined
          ? translationSelector(translation)
          : undefined,
    })),
  ).thenW(
    (
      values,
    ): Reader<
      ER & StdEnv<"t" | "lc" | "lj">,
      RawDefinitionListEntityDescriptionSectionItem | undefined
    > => {
      if (isNotEmpty(values)) {
        const sameValues = anySameIndices(
          values,
          on(value => [value.value, value.valueTranslation], deepEqual),
        )

        if (
          values.length === 1 ||
          (isNotEmpty(sameValues) &&
            sameValues.length === 1 &&
            sameValues[0].length === values.length)
        ) {
          return values[0].value === undefined &&
            values[0].valueTranslation === undefined &&
            allowEmpty
            ? Reader.of(undefined)
            : /* values[0].valueTranslation ?? */ renderValue(values[0].value, false).thenW(
                renderedValue =>
                  mapNullableR(renderedValue, safeRenderedValue =>
                    translateR(label).map(translatedLabel => ({
                      label: translatedLabel,
                      value: (textPrefix ?? "") + safeRenderedValue,
                    })),
                  ),
              )
        } else {
          return translateR(label).thenW(translatedLabel =>
            localeSortOnR(values, item => item.name)
              .thenW(sortedValues =>
                Reader.traverse(sortedValues, value =>
                  renderValue(value.value, true).map(renderedValue =>
                    mapNullable(renderedValue, safeRenderedValue => ({
                      label: value.name,
                      value: safeRenderedValue,
                    })),
                  ),
                ),
              )
              .thenW(sortedValues =>
                Reader.traverse(
                  Map.groupBy(sortedValues.filter(isNotNullish), item => item.value)
                    .entries()
                    .toArray(),
                  ([value, items]) =>
                    localeJoinR(
                      items.map(item => item.label),
                      "conjunction",
                    ).map(itemLabel => ({
                      label: itemLabel,
                      value,
                    })),
                ),
              )
              .map(groupedItems => ({
                label: translatedLabel,
                value: [
                  ...(textPrefix !== undefined
                    ? [{ type: "plain" as const, text: textPrefix }]
                    : []),
                  {
                    type: "definitionList",
                    style: "nested",
                    items: groupedItems,
                  },
                ],
              })),
          )
        }
      } else {
        // at least one value and thus one variant is required
        return Reader.of(undefined)
      }
    },
  )

const renderAutomaticAdvantagesOrDisadvantages = <ID extends string, T extends string | undefined>(
  entity: "Advantage" | "Disadvantage",
  items: AutomaticAdvantageDisadvantage<ID>[] | undefined,
  emptyString: T,
): StdReader<
  string | T,
  "t" | "tm" | "lc" | "ibi" | "rso",
  | ActivatableIdentifier["kind"]
  | "Aspect"
  | Exclude<RequirableSelectOptionIdentifier["kind"], "General">
> =>
  items === undefined || !isNotEmpty(items)
    ? Reader.of(emptyString)
    : Reader.traverse(
        items,
        (
          item,
        ): StdReader<
          ActivatableNameComponents | undefined,
          "t" | "rso" | "ibi",
          | ActivatableIdentifier["kind"]
          | "Aspect"
          | Exclude<RequirableSelectOptionIdentifier["kind"], "General">
        > =>
          printActivatableName(Case(entity, item.id), item.options, item.level).with(env => ({
            ...env,
            displayedInProfession: true,
          })),
      )
        .map(renderedItems =>
          renderedItems.filter(isNotNullish).map(nameComponents => ({
            type: "activatable",
            part: { value: nameComponents, sentenceType: undefined, isMeta: false },
          })),
        )
        .thenW(joinPrerequisiteParts)

/**
 * Render the names of commonness-rated advantages and disadvantages together.
 */
export const renderAutomaticAdvantagesAndDisadvantages = <T extends string | undefined>(
  advantages: AutomaticAdvantageDisadvantage<string>[] | undefined,
  disadvantages: AutomaticAdvantageDisadvantage<string>[] | undefined,
  emptyString: T,
): StdReader<
  string | T,
  "t" | "tm" | "lc" | "ibi" | "rso",
  | ActivatableIdentifier["kind"]
  | "Aspect"
  | Exclude<RequirableSelectOptionIdentifier["kind"], "General">
> =>
  Reader.traverse(
    [["Advantage", advantages] as const, ["Disadvantage", disadvantages] as const],
    ([entity, items]) =>
      Reader.traverse(
        items ?? [],
        (
          item,
        ): StdReader<
          ActivatableNameComponents | undefined,
          "t" | "rso" | "ibi",
          | ActivatableIdentifier["kind"]
          | "Aspect"
          | Exclude<RequirableSelectOptionIdentifier["kind"], "General">
        > =>
          printActivatableName(Case(entity, item.id), item.options, item.level).with(env => ({
            ...env,
            displayedInProfession: true,
          })),
      )

        .map(renderedItems => renderedItems.filter(isNotNullish)),
  ).thenW(
    (items): StdReader<string | T, "t" | "tm" | "lc"> =>
      mapNullable(ensureNonEmpty(items.flat()), safeItems =>
        joinPrerequisiteParts(
          safeItems.map(nameComponents => ({
            type: "activatable",
            part: { value: nameComponents, sentenceType: undefined, isMeta: false },
          })),
        ),
      ) ?? Reader.of(emptyString),
  )

const renderCommonCultures = (
  items: Culture_ID[] | undefined,
): StdReader<string, "t" | "tm" | "lc" | "ibi", "Culture"> =>
  Reader.asks(({ translate, translateMap, getInstanceById, localeCompare }) =>
    items === undefined || !isNotEmpty(items)
      ? translate("none")
      : items
          .map(itemId => attributedName(translateMap, getInstanceById, "race", "Culture", itemId))
          .filter(isNotNullish)
          .toSorted(localeCompare)
          .join(", "),
  )

/**
 * Get a JSON representation of the rules text for a race.
 */
export const getRaceEntityDescription = createEntityDescriptionCreator<
  "Race",
  {
    getInstanceById: GetInstanceById<
      | "Publication"
      | "Attribute"
      | ActivatableIdentifier["kind"]
      | "Aspect"
      | "Culture"
      | "DerivedCharacteristic"
      | Exclude<RequirableSelectOptionIdentifier["kind"], "General">
    >
    countInstances: CountInstances<"Attribute">
    getChildInstancesForInstanceId: GetAllChildInstancesForParent<"RaceVariant">
    getResolvedSelectOptionById: GetResolvedSelectOptionById
    settings: Settings
  }
>(
  (
    {
      getInstanceById,
      countInstances,
      getChildInstancesForInstanceId,
      getResolvedSelectOptionById,
    },
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
      getResolvedSelectOptionById,
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
              value: translate(".input {$value :number} {{{$value} Adventure Points}}", {
                value: entry.ap_value,
              }),
            },
            ...renderBaseValues(entry.base_values).run(env),
            ...Reader.sequence<
              StdEnv<
                "t" | "tm" | "lc" | "lj" | "ibi" | "rso",
                | "Attribute"
                | "Culture"
                | ActivatableIdentifier["kind"]
                | "Aspect"
                | Exclude<RequirableSelectOptionIdentifier["kind"], "General">
              >,
              RawDefinitionListEntityDescriptionSectionItem | undefined
            >([
              renderVariantValues(
                "Attribute Adjustments",
                raceVariants,
                v => v.attribute_adjustments,
                attrs => renderAttributeAdjustmentsItem(totalAttributesCount, attrs),
              ),
              renderVariantValues(
                "Common Cultures",
                raceVariants,
                v => v.common_cultures,
                cultures => renderCommonCultures(cultures),
              ),
              renderVariantValues(
                "Automatic Advantages",
                raceVariants,
                v => v.automatic_advantages,
                advs =>
                  renderAutomaticAdvantagesOrDisadvantages("Advantage", advs, translate("none")),
                vt => vt.automatic_advantages,
                true,
              ),
              renderVariantValues(
                "Automatic Disadvantages",
                raceVariants,
                v => v.automatic_disadvantages,
                advs =>
                  renderAutomaticAdvantagesOrDisadvantages("Disadvantage", advs, translate("none")),
                vt => vt.automatic_disadvantages,
                true,
              ),
              renderVariantValues(
                "Strongly recommended Advantages and Disadvantages",
                raceVariants,
                v =>
                  v.strongly_recommended_advantages === undefined &&
                  v.strongly_recommended_disadvantages === undefined
                    ? undefined
                    : ([
                        v.strongly_recommended_advantages,
                        v.strongly_recommended_disadvantages,
                      ] as const),
                (advsDisadvs, isSplit) =>
                  advsDisadvs === undefined
                    ? isSplit
                      ? Reader.of(undefined)
                      : translateR("none")
                    : renderAutomaticAdvantagesAndDisadvantages(
                        ...advsDisadvs,
                        isSplit ? undefined : translate("none"),
                      ),
                vt =>
                  ensureNonEmpty(
                    [
                      vt.strongly_recommended_advantages,
                      vt.strongly_recommended_disadvantages,
                    ].filter(isNotNullish),
                  )?.join("; "),
                true,
                `${translate(
                  "The following advantages and disadvantages distinguish Aventurian {$race}. You should choose these advantages and disadvantages. If you don’t want to take them, talk to your GM.",
                  { race: translation.name },
                )} `,
              ),
              renderVariantValues(
                "Common Advantages",
                raceVariants,
                v => v.common_advantages,
                (advs, isSplit) =>
                  renderCommonnessRatedAdvantagesOrDisadvantages(
                    "Advantage",
                    advs,
                    isSplit ? undefined : translate("none"),
                  ),
                vt => vt.common_advantages,
              ),
              renderVariantValues(
                "Common Disadvantages",
                raceVariants,
                v => v.common_disadvantages,
                (advs, isSplit) =>
                  renderCommonnessRatedAdvantagesOrDisadvantages(
                    "Disadvantage",
                    advs,
                    isSplit ? undefined : translate("none"),
                  ),
                vt => vt.common_disadvantages,
              ),
              renderVariantValues(
                "Uncommon Advantages",
                raceVariants,
                v => v.uncommon_advantages,
                (advs, isSplit) =>
                  renderCommonnessRatedAdvantagesOrDisadvantages(
                    "Advantage",
                    advs,
                    isSplit ? undefined : translate("none"),
                  ),
                vt => vt.uncommon_advantages,
              ),
              renderVariantValues(
                "Uncommon Disadvantages",
                raceVariants,
                v => v.uncommon_disadvantages,
                (advs, isSplit) =>
                  renderCommonnessRatedAdvantagesOrDisadvantages(
                    "Disadvantage",
                    advs,
                    isSplit ? undefined : translate("none"),
                  ),
                vt => vt.uncommon_disadvantages,
              ),
            ]).run(env),
          ],
        },
      ],
      errata: translation.errata,
      references: entry.src,
    }
  },
)
