import { ensureNonEmpty } from "@elyukai/utils/array/nonEmpty"
import { isNotNullish, mapNullable } from "@elyukai/utils/nullable"
import { Reader } from "@elyukai/utils/reader"
import { sign } from "@elyukai/utils/string/number"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type {
  ActivatableIdentifier,
  AnimalVenomLevel,
  DemonicPoisonLevel,
  Intoxicant,
  IntoxicantAddiction,
  PlainGeneralPrerequisites,
  PoisonApplicationType,
  PoisonCost,
  PoisonDuration,
  PoisonSourceType,
  PoisonStart,
  RatedIdentifier,
} from "@optolith/database-schema/gen"
import { createEntityDescriptionCreator } from "../creator.js"
import type { GetInstanceById } from "../helpers/getTypes.js"
import type { LocaleCompare, LocaleJoin } from "../helpers/locale.js"
import type { Format, Translate, TranslateMap } from "../helpers/translate.js"
import type { IdMap, RawDefinitionListEntityDescriptionSectionItem } from "../index.js"
import { renderDice, renderDiceR } from "./partial/dice.js"
import {
  renderAlternativeNames,
  renderChance,
  renderLaboratoryLevel,
  renderResistance,
} from "./partial/herbary.js"
import { renderMathOperationR } from "./partial/mathOperation.js"
import { printPlainGeneralPrerequisites } from "./partial/prerequisites/index.js"
import type { GetResolvedSelectOptionById } from "./partial/prerequisites/single/activatable.js"
import { parensIf } from "./partial/rated/activatable/parensIf.js"
import { translateMapR, translateR, type EnvMap, type StdReader } from "./partial/reader.js"
import { ResponsiveTextSize } from "./partial/responsiveText.js"
import { formatTimeSpan, formatTimeSpanR } from "./partial/units/timeSpan.js"
import { MISSING_VALUE, UNHANDLED_VALUE } from "./partial/unknown.js"

const renderApplicationType = (
  translate: Translate,
  localeJoin: LocaleJoin,
  localeCompare: LocaleCompare,
  applicationType: PoisonApplicationType[],
) =>
  translate("{$types} poison", {
    types: localeJoin(
      applicationType
        .map(type => {
          switch (type.kind) {
            case "Weapon":
              return translate("Weapon (poison)")
            case "Ingestion":
              return translate("Ingestion (poison)")
            case "Inhalation":
              return translate("Inhalation (poison)")
            case "Contact":
              return translate("Contact (poison)")
            default:
              return assertExhaustive(type)
          }
        })
        .toSorted(localeCompare)
        .map((type, index, arr) =>
          index === arr.length - 1 && type.at(-1) === "-" ? type.slice(0, -1) : type,
        ),
      "conjunction",
    ),
  })

const renderLevel = (
  translate: Translate,
  translateMap: TranslateMap,
  level: AnimalVenomLevel | DemonicPoisonLevel,
): string | number => {
  switch (level.kind) {
    case "QualityLevel":
      return translate("QL")
    case "Constant":
      return typeof level.Constant === "number" ? level.Constant : level.Constant.value
    case "BySubtype":
      return level.BySubtype.map(
        subtype =>
          `${subtype.value.toFixed()} (${translateMap(subtype.translations)?.name ?? MISSING_VALUE})`,
      ).join(", ")
    default:
      return assertExhaustive(level)
  }
}

const renderAddiction = (
  translate: Translate,
  translateMap: TranslateMap,
  format: Format,
  getInstanceById: GetInstanceById<"Disease">,
  addiction: IntoxicantAddiction,
) =>
  [
    ensureNonEmpty(
      [
        mapNullable(
          renderChance(translate, translateMap, addiction),
          chance =>
            chance +
            parensIf(
              addiction.check === undefined
                ? undefined
                : addiction.check.onlySameMonth === true
                  ? translate(
                      ".input {$count :number} {{check required every {$count}. application in the same month}}",
                      { count: addiction.check.interval },
                    )
                  : translate(
                      ".input {$count :number} {{check required every {$count}. application}}",
                      { count: addiction.check.interval },
                    ),
            ),
        ),
        mapNullable(addiction.disease, diseaseId => {
          const disease = getInstanceById("Disease", diseaseId)
          const diseaseTranslation = translateMap(disease?.translations)
          return translate("see {$link}", {
            link: diseaseTranslation?.name ?? MISSING_VALUE,
          })
        }),
      ].filter(isNotNullish),
    )?.join(", "),
    mapNullable(addiction.withdrawalPrevention, withdrawalPrevention =>
      translate(".input {$value :number} {{{$value} applications every {$interval}}}", {
        value: withdrawalPrevention.amount,
        interval: formatTimeSpan(
          translate,
          translateMap,
          format,
          ResponsiveTextSize.Full,
          { kind: "Days" },
          (() => {
            switch (withdrawalPrevention.interval.kind) {
              case "Constant":
                return withdrawalPrevention.interval.Constant.value
              case "DiceBased":
                return renderDice(translate, withdrawalPrevention.interval.DiceBased.dice)
              default:
                return assertExhaustive(withdrawalPrevention.interval)
            }
          })(),
          true,
        ),
      }),
    ),
  ]
    .filter(isNotNullish)
    .join("; ")

const renderIntoxicantValues = (
  translate: Translate,
  translateMap: TranslateMap,
  format: Format,
  getInstanceById: GetInstanceById<"Disease">,
  intoxicant: Intoxicant,
) => {
  const translation = translateMap(intoxicant.translations)
  return {
    ingestion: translation?.ingestion ?? MISSING_VALUE,
    sideEffect: translation?.side_effect,
    overdose: translation?.overdose ?? MISSING_VALUE,
    legality: intoxicant.legality.is_legal ? translate("legal") : translate("illegal"),
    special: translation?.special,
    addiction:
      intoxicant.addiction === undefined
        ? undefined
        : renderAddiction(translate, translateMap, format, getInstanceById, intoxicant.addiction),
  }
}

const renderSourceTypeBasedValues = (
  translate: Translate,
  translateMap: TranslateMap,
  format: Format,
  getInstanceById: GetInstanceById<"Disease">,
  sourceType: PoisonSourceType,
): {
  level: string | number
  sourceType: string
  ingestion?: string
  sideEffect?: string
  overdose?: string
  legality?: string
  special?: string
  addiction?: string
  typicalIngredients?: string
  priceOfIngedientsPerLevel?: string
  laboratory?: string
  brewingDifficulty?: string
  prerequisitesBrewingProcess?: string
  tradeSecret?: {
    apValue: number
    prerequisites?: PlainGeneralPrerequisites
  }
  note?: string
} => {
  switch (sourceType.kind) {
    case "AnimalVenom":
      return {
        level: renderLevel(translate, translateMap, sourceType.AnimalVenom.level),
        sourceType: translate("animal venom"),
        tradeSecret: mapNullable(sourceType.AnimalVenom.complexity, complexity =>
          complexity.kind === "Complex"
            ? {
                apValue: complexity.Complex.ap_value,
                prerequisites: complexity.Complex.prerequisites,
              }
            : undefined,
        ),
      }
    case "AlchemicalPoison": {
      const translation = translateMap(sourceType.AlchemicalPoison.translations)
      return {
        level: translate("QL"),
        sourceType: [
          sourceType.AlchemicalPoison.isDemonic === true ? translate("demonic poison") : undefined,
          translate("alchemical poison"),
        ]
          .filter(isNotNullish)
          .join(", "),
        ...(sourceType.AlchemicalPoison.intoxicant === undefined
          ? undefined
          : renderIntoxicantValues(
              translate,
              translateMap,
              format,
              getInstanceById,
              sourceType.AlchemicalPoison.intoxicant,
            )),
        typicalIngredients: translation?.typical_ingredients.join(", "),
        priceOfIngedientsPerLevel: translate("{$cost} per level", {
          cost: translate(".input {$value :number} {{{$value} silverthalers}}", {
            value: sourceType.AlchemicalPoison.cost_per_ingredient_level,
          }),
        }),
        laboratory: renderLaboratoryLevel(translate, sourceType.AlchemicalPoison.laboratory),
        brewingDifficulty: sign(sourceType.AlchemicalPoison.brewing_difficulty),
        prerequisitesBrewingProcess:
          translation?.brewing_process_prerequisites ?? translate("none"),
        tradeSecret: mapNullable(sourceType.AlchemicalPoison.trade_secret, tradeSecret => ({
          apValue: tradeSecret.ap_value,
          prerequisites: tradeSecret.prerequisites,
        })),
      }
    }
    case "AlchemicalPactGiftPoison":
      return {
        level: translate("QL"),
        sourceType: translate("alchemical poison"),
      }
    case "MineralPoison":
      return {
        level: sourceType.MineralPoison.level,
        sourceType: translate("mineral poison"),
      }
    case "PlantPoison":
      return {
        level: sourceType.PlantPoison.level,
        sourceType: translate("plant poison"),
        ...(sourceType.PlantPoison.intoxicant === undefined
          ? undefined
          : renderIntoxicantValues(
              translate,
              translateMap,
              format,
              getInstanceById,
              sourceType.PlantPoison.intoxicant,
            )),
      }
    case "DemonicPoison": {
      const translation = translateMap(sourceType.DemonicPoison.translations)
      return {
        level: renderLevel(translate, translateMap, sourceType.DemonicPoison.level),
        sourceType: translate("demonic poison"),
        note: translation?.note,
      }
    }
    default:
      return assertExhaustive(sourceType)
  }
}

const renderStart = (start: PoisonStart): StdReader<string, "t" | "tm" | "f" | "rts"> => {
  switch (start.kind) {
    case "Immediate":
      return translateR("immediate")
    case "ExpressionBased":
      return renderMathOperationR(
        start.ExpressionBased.value,
        (value): StdReader<string | number, "t"> => {
          switch (value.kind) {
            case "Constant":
              return Reader.of(value.Constant)
            case "Dice":
              return renderDiceR(value.Dice)
            case "CircleOfDamnation":
              return translateR("CoD")
            default:
              return assertExhaustive(value)
          }
        },
      ).thenW(value => formatTimeSpanR(start.ExpressionBased.unit, value))
    case "Indefinite":
      return translateMapR(start.Indefinite.translations).map(
        translation => translation?.description ?? UNHANDLED_VALUE,
      )
    default:
      return assertExhaustive(start)
  }
}

const renderDuration = (duration: PoisonDuration): StdReader<string, "t" | "tm" | "f" | "rts"> => {
  switch (duration.kind) {
    case "Instant":
      return translateR("instant")
    case "ExpressionBased":
      return renderMathOperationR(
        duration.ExpressionBased.value,
        (value): StdReader<string | number, "t"> => {
          switch (value.kind) {
            case "Constant":
              return Reader.of(value.Constant)
            case "Dice":
              return renderDiceR(value.Dice)
            case "CircleOfDamnation":
              return translateR("CoD")
            default:
              return assertExhaustive(value)
          }
        },
      ).thenW(value => formatTimeSpanR(duration.ExpressionBased.unit, value))
    case "Indefinite":
      return translateMapR(duration.Indefinite.translations).map(
        translation => translation?.description ?? UNHANDLED_VALUE,
      )
    default:
      return assertExhaustive(duration)
  }
}

const renderCost = (translate: Translate, translateMap: TranslateMap, cost: PoisonCost) => {
  switch (cost.kind) {
    case "CannotBeExtracted":
      return translate("cannot be extracted")
    case "None":
      return translate("none")
    case "Constant":
      return translate(".input {$value :number} {{{$value} silverthalers}}", {
        value: cost.Constant,
      })
    case "DependingOnPurchaseOrSale":
      return `${translate(".input {$value :number} {{{$value} silverthalers}}", {
        value: cost.DependingOnPurchaseOrSale.purchase,
      })} (${translate("purchase")}) / ${translate(
        ".input {$value :number} {{{$value} silverthalers}}",
        {
          value: cost.DependingOnPurchaseOrSale.sale,
        },
      )} (${translate("sale")})`
    case "Indefinite":
      return translateMap(cost.Indefinite.translations)?.description ?? MISSING_VALUE
    case "Range":
      return translate(
        ".input {$from :number} .input {$to :number} {{{$from}–{$to} silverthalers}}",
        {
          from: cost.Range.from,
          to: cost.Range.to,
        },
      )
    default:
      return assertExhaustive(cost)
  }
}

const renderValueCost = (
  translate: Translate,
  translateMap: TranslateMap,
  cost: PoisonCost,
  value: number | undefined,
): RawDefinitionListEntityDescriptionSectionItem =>
  value === undefined
    ? {
        label: translate("Cost"),
        value: renderCost(translate, translateMap, cost),
      }
    : {
        label: translate("Value/Cost"),
        value: `${translate(".input {$value :number} {{{$value} silverthalers}}", {
          value,
        })} / ${renderCost(translate, translateMap, cost)}`,
      }

/**
 * Get a JSON representation of the rules text for a poison.
 */
export const getPoisonEntityDescription = createEntityDescriptionCreator<
  "Poison",
  {
    getInstanceById: GetInstanceById<
      | "Publication"
      | "DerivedCharacteristic"
      | "Disease"
      | ActivatableIdentifier["kind"]
      | RatedIdentifier["kind"]
      | "Race"
      | "Culture"
      | "State"
      | "Enhancement"
      | "PactCategory"
      | "PactDomain"
      | "SocialStatus"
      | "Aspect"
      | "Property"
      | "PersonalityTrait"
    >
    getResolvedSelectOptionById: GetResolvedSelectOptionById
    idMap: IdMap
  }
>(({ getInstanceById, getResolvedSelectOptionById, idMap }, locale, { content: entry }) => {
  const { translate, translateMap, format, join: localeJoin, compare: localeCompare } = locale
  const translation = translateMap(entry.translations)

  if (translation === undefined) {
    return undefined
  }

  const env = {
    translate,
    translateMap,
    format,
    responsiveTextSize: ResponsiveTextSize.Full,
  } satisfies Partial<EnvMap>

  const applicationType = renderApplicationType(
    translate,
    localeJoin,
    localeCompare,
    entry.application_type,
  )

  const {
    level,
    sourceType,
    ingestion,
    sideEffect,
    overdose,
    legality,
    special,
    addiction,
    typicalIngredients,
    priceOfIngedientsPerLevel,
    laboratory,
    brewingDifficulty,
    prerequisitesBrewingProcess,
    tradeSecret,
    note,
  } = renderSourceTypeBasedValues(
    translate,
    translateMap,
    format,
    getInstanceById,
    entry.source_type,
  )

  return {
    title: translation.name,
    className: "poison",
    body: [
      {
        type: "definitionList",
        items: [
          renderAlternativeNames(translate, translation.alternative_names),
          {
            label: translate("Level"),
            value: typeof level === "number" ? level.toFixed() : level,
          },
          {
            label: translate("Type"),
            value: `${applicationType}, ${sourceType}`,
          },
          {
            label: translate("Resistance"),
            value: renderResistance(
              translate,
              translateMap,
              getInstanceById,
              idMap,
              entry.resistance,
            ),
          },
          ingestion === undefined
            ? undefined
            : {
                label: translate("Ingestion"),
                value: ingestion,
              },
          {
            label: translate("Effect"),
            value:
              translation.effect.default +
              (translation.effect.reduced === undefined ? "" : ` / ${translation.effect.reduced}`),
          },
          sideEffect === undefined
            ? undefined
            : {
                label: translate("Side Effect"),
                value: sideEffect,
              },
          overdose === undefined
            ? undefined
            : {
                label: translate("Overdose"),
                value: overdose,
              },
          {
            label: translate("Start"),
            value: renderStart(entry.start).run(env),
          },
          {
            label: translate("Duration"),
            value:
              renderDuration(entry.duration.default).run(env) +
              (entry.duration.reduced === undefined
                ? ""
                : ` / ${renderDuration(entry.duration.reduced).run(env)}`),
          },
          legality === undefined
            ? undefined
            : {
                label: translate("Legality"),
                value: legality,
              },
          entry.cost === undefined
            ? undefined
            : renderValueCost(translate, translateMap, entry.cost, entry.value),
          special === undefined
            ? undefined
            : {
                label: translate("Special"),
                value: special,
              },
          addiction === undefined
            ? undefined
            : {
                label: translate("Addiction"),
                value: addiction,
              },
          typicalIngredients === undefined
            ? undefined
            : {
                label: translate("Typical Ingredients"),
                value: typicalIngredients,
              },
          priceOfIngedientsPerLevel === undefined
            ? undefined
            : {
                label: translate("Price of Ingredients/Level"),
                value: priceOfIngedientsPerLevel,
              },
          laboratory === undefined
            ? undefined
            : {
                label: translate("Laboratory"),
                value: laboratory,
              },
          brewingDifficulty === undefined
            ? undefined
            : {
                label: translate("Brewing Difficulty"),
                value: brewingDifficulty,
              },
          prerequisitesBrewingProcess === undefined
            ? undefined
            : {
                label: `${translate("Prerequisites")} (${translate("Brewing Process")})`,
                value: prerequisitesBrewingProcess,
              },
          tradeSecret === undefined
            ? undefined
            : {
                label: `${translate("AP Value")} (${translate("Trade Secret")})`,
                value:
                  translate("{$value} AP", { value: tradeSecret.apValue }) +
                  parensIf(
                    mapNullable(
                      tradeSecret.prerequisites,
                      prerequisites =>
                        `${translate("Prerequisites")}: ${printPlainGeneralPrerequisites(
                          getInstanceById,
                          getResolvedSelectOptionById,
                          locale,
                          prerequisites,
                        )}`,
                    ),
                  ),
              },
          {
            label: translate("Quality Levels"),
            value: translate("The poison levels equals the QL."),
          },
          translation.notes !== undefined
            ? {
                label: translate("Note"),
                value: translation.notes,
              }
            : note === undefined
              ? undefined
              : {
                  label: translate("Note"),
                  value: note,
                },
        ],
      },
    ],
    errata: translation.errata,
    references: entry.src,
  }
})
