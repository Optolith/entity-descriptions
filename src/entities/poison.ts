import { isNotNullish, mapNullable } from "@elyukai/utils/nullable"
import { sign } from "@elyukai/utils/string/number"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type {
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
  Resistance,
} from "optolith-database-schema/gen"
import { createEntityDescriptionCreator } from "../creator.js"
import type { GetInstanceById } from "../helpers/getTypes.js"
import type { LocaleJoin } from "../helpers/locale.js"
import type { Translate, TranslateMap } from "../helpers/translate.js"
import type { EntityDescriptionSection, IdMap } from "../index.js"
import { renderDice, renderDiceAndFlat } from "./partial/dice.js"
import { renderLaboratoryLevel } from "./partial/herbary.js"
import { renderMathOperation } from "./partial/mathOperation.js"
import { printPlainGeneralPrerequisites } from "./partial/prerequisites/index.js"
import type { GetResolvedSelectOptionById } from "./partial/prerequisites/single/activatable.js"
import { parensIf } from "./partial/rated/activatable/parensIf.js"
import { ResponsiveTextSize } from "./partial/responsiveText.js"
import { formatTimeSpan } from "./partial/units/timeSpan.js"
import { MISSING_VALUE, UNHANDLED_VALUE } from "./partial/unknown.js"

const renderApplicationType = (
  translate: Translate,
  localeJoin: LocaleJoin,
  applicationType: PoisonApplicationType[],
) =>
  translate("{$types} poison", {
    types: localeJoin(
      applicationType.map(type => {
        switch (type.kind) {
          case "Weapon":
            return translate("Weapon")
          case "Ingestion":
            return translate("Ingestion")
          case "Inhalation":
            return translate("Inhalation")
          case "Contact":
            return translate("Contact")
          default:
            return assertExhaustive(type)
        }
      }),
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
      return typeof level.Constant === "number"
        ? level.Constant
        : level.Constant.value
    case "BySubtype":
      return level.BySubtype.map(
        subtype =>
          `${subtype.value} (${
            translateMap(subtype.translations)?.name ?? MISSING_VALUE
          })`,
      ).join(", ")
    default:
      return assertExhaustive(level)
  }
}

const renderAddiction = (
  translate: Translate,
  translateMap: TranslateMap,
  addiction: IntoxicantAddiction,
) =>
  [
    translateMap(addiction.translations)?.chance ??
      (addiction.chance === undefined
        ? undefined
        : translate("{$valueRange} on {$dice}", {
            valueRange:
              addiction.chance === 5 ? 1 : `1–${addiction.chance / 5}`,
            dice: renderDice(translate, { number: 1, sides: 20 }),
          })),
    translate(
      ".input {$value :number} {{{$value} applications every {$interval}}}",
      {
        value: addiction.withdrawalPrevention.amount,
        interval: formatTimeSpan(
          translate,
          ResponsiveTextSize.Full,
          { kind: "Days" },
          (() => {
            switch (addiction.withdrawalPrevention.interval.kind) {
              case "Constant":
                return addiction.withdrawalPrevention.interval.Constant.value
              case "DiceBased":
                return renderDice(
                  translate,
                  addiction.withdrawalPrevention.interval.DiceBased.dice,
                )
              default:
                return assertExhaustive(addiction.withdrawalPrevention.interval)
            }
          })(),
        ),
      },
    ),
  ]
    .filter(isNotNullish)
    .join("; ")

const renderIntoxicantValues = (
  translate: Translate,
  translateMap: TranslateMap,
  intoxicant: Intoxicant,
) => {
  const translation = translateMap(intoxicant.translations)
  return {
    ingestion: translation?.ingestion ?? MISSING_VALUE,
    sideEffect: translation?.side_effect,
    overdose: translation?.overdose ?? MISSING_VALUE,
    legality: intoxicant.legality.is_legal
      ? translate("legal")
      : translate("illegal"),
    special: translation?.special,
    addiction:
      intoxicant?.addiction === undefined
        ? undefined
        : renderAddiction(translate, translateMap, intoxicant.addiction),
  }
}

const renderSourceTypeBasedValues = (
  translate: Translate,
  translateMap: TranslateMap,
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
        level: renderLevel(
          translate,
          translateMap,
          sourceType.AnimalVenom.level,
        ),
        sourceType: translate("animal venom"),
      }
    case "AlchemicalPoison": {
      const translation = translateMap(sourceType.AlchemicalPoison.translations)
      return {
        level: translate("QL"),
        sourceType: translate("alchemical poison"),
        ...(sourceType.AlchemicalPoison.intoxicant === undefined
          ? undefined
          : renderIntoxicantValues(
              translate,
              translateMap,
              sourceType.AlchemicalPoison.intoxicant,
            )),
        typicalIngredients: translation?.typical_ingredients.join(", "),
        priceOfIngedientsPerLevel: translate("{$cost} per level", {
          cost: translate(
            ".input {$value :number} {{{$value} silverthalers}}",
            { value: sourceType.AlchemicalPoison.cost_per_ingredient_level },
          ),
        }),
        laboratory: renderLaboratoryLevel(
          translate,
          sourceType.AlchemicalPoison.laboratory,
        ),
        brewingDifficulty: sign(sourceType.AlchemicalPoison.brewing_difficulty),
        prerequisitesBrewingProcess:
          translation?.brewing_process_prerequisites ?? translate("none"),
        tradeSecret: mapNullable(
          sourceType.AlchemicalPoison.trade_secret,
          tradeSecret => ({
            apValue: tradeSecret.ap_value,
            prerequisites: tradeSecret.prerequisites,
          }),
        ),
      }
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
              sourceType.PlantPoison.intoxicant,
            )),
      }
    case "DemonicPoison": {
      const translation = translateMap(sourceType.DemonicPoison.translations)
      return {
        level: renderLevel(
          translate,
          translateMap,
          sourceType.DemonicPoison.level,
        ),
        sourceType: translate("demonic poison"),
        note: translation?.note,
      }
    }
    default:
      return assertExhaustive(sourceType)
  }
}

const renderResistance = (
  translate: Translate,
  translateMap: TranslateMap,
  getInstanceById: GetInstanceById<"DerivedCharacteristic">,
  idMap: IdMap,
  resistance: Resistance,
) => {
  switch (resistance.kind) {
    case "Spirit":
      return (
        translateMap(
          getInstanceById(
            "DerivedCharacteristic",
            idMap.DerivedCharacteristic.Spirit,
          )?.translations,
        )?.name ?? MISSING_VALUE
      )

    case "Toughness":
      return (
        translateMap(
          getInstanceById(
            "DerivedCharacteristic",
            idMap.DerivedCharacteristic.Toughness,
          )?.translations,
        )?.name ?? MISSING_VALUE
      )

    case "LowerOfSpiritAndToughness": {
      const spiritTranslation =
        translateMap(
          getInstanceById(
            "DerivedCharacteristic",
            idMap.DerivedCharacteristic.Spirit,
          )?.translations,
        )?.name ?? MISSING_VALUE
      const toughnessTranslation =
        translateMap(
          getInstanceById(
            "DerivedCharacteristic",
            idMap.DerivedCharacteristic.Toughness,
          )?.translations,
        )?.name ?? MISSING_VALUE
      return translate(
        "{$first} or {$second}, depending on which value is lower",
        {
          first: spiritTranslation,
          second: toughnessTranslation,
        },
      )
    }

    default:
      return assertExhaustive(resistance)
  }
}

const renderStart = (
  translate: Translate,
  translateMap: TranslateMap,
  start: PoisonStart,
) => {
  switch (start.kind) {
    case "Immediate":
      return translate("immediate")
    case "Constant":
      return formatTimeSpan(
        translate,
        ResponsiveTextSize.Full,
        start.Constant.unit,
        start.Constant.value,
      )
    case "DiceBased":
      return formatTimeSpan(
        translate,
        ResponsiveTextSize.Full,
        start.DiceBased.unit,
        renderDiceAndFlat(
          translate,
          start.DiceBased.dice,
          start.DiceBased.flat,
        ),
      )
    case "Indefinite":
      return (
        translateMap(start.Indefinite.translations)?.description ??
        UNHANDLED_VALUE
      )
    default:
      return assertExhaustive(start)
  }
}

const renderDuration = (
  translate: Translate,
  translateMap: TranslateMap,
  duration: PoisonDuration,
) => {
  switch (duration.kind) {
    case "Instant":
      return translate("instant")
    case "Constant":
      return formatTimeSpan(
        translate,
        ResponsiveTextSize.Full,
        duration.Constant.unit,
        duration.Constant.value,
      )
    case "DiceBased":
      return formatTimeSpan(
        translate,
        ResponsiveTextSize.Full,
        duration.DiceBased.unit,
        renderDiceAndFlat(
          translate,
          duration.DiceBased.dice,
          duration.DiceBased.flat,
        ),
      )
    case "ExpressionBased":
      return renderMathOperation(duration.ExpressionBased.value, value => {
        switch (value.kind) {
          case "Constant":
            return value.Constant.toString()
          case "Dice":
            return renderDice(translate, value.Dice)
          default:
            return assertExhaustive(value)
        }
      })
    case "Indefinite":
      return (
        translateMap(duration.Indefinite.translations)?.description ??
        UNHANDLED_VALUE
      )
    default:
      return assertExhaustive(duration)
  }
}

const renderCost = (
  translate: Translate,
  translateMap: TranslateMap,
  cost: PoisonCost,
) => {
  switch (cost.kind) {
    case "CannotBeExtracted":
      return translate("cannot be extracted")
    case "None":
      return translate("none")
    case "Constant":
      return translate(".input {$value :number} {{{$value} silverthalers}}", {
        value: cost.Constant,
      })
    case "Indefinite":
      return (
        translateMap(cost.Indefinite.translations)?.description ?? MISSING_VALUE
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
): EntityDescriptionSection =>
  value === undefined
    ? {
        label: translate("Cost"),
        value: renderCost(translate, translateMap, cost),
      }
    : {
        label: translate("Value/Cost"),
        value: `${translate(
          ".input {$value :number} {{{$value} silverthalers}}",
          {
            value,
          },
        )} / ${renderCost(translate, translateMap, cost)}`,
      }

/**
 * Get a JSON representation of the rules text for a poison.
 */
export const getPoisonEntityDescription = createEntityDescriptionCreator<
  "Poison",
  {
    getInstanceById: GetInstanceById<"DerivedCharacteristic">
    getResolvedSelectOptionById: GetResolvedSelectOptionById
    idMap: IdMap
  }
>(
  (
    { getInstanceById, getResolvedSelectOptionById, idMap },
    locale,
    { content: entry },
  ) => {
    const { translate, translateMap, join: localeJoin } = locale
    const translation = translateMap(entry.translations)

    if (translation === undefined) {
      return undefined
    }

    const applicationType = renderApplicationType(
      translate,
      localeJoin,
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
    } = renderSourceTypeBasedValues(translate, translateMap, entry.source_type)

    return {
      title: translation.name,
      className: "poison",
      body: [
        translation.alternative_names === undefined
          ? undefined
          : {
              label: translate(
                ".input {$hiddenCount :number} {{Alternative Names}}",
                { hiddenCount: translation.alternative_names.length },
              ),
              value: translation.alternative_names
                .map(name => name.name + parensIf(name.region))
                .join(", "),
            },
        {
          label: translate("Level"),
          value: level,
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
            (translation.effect.reduced === undefined
              ? ""
              : ` / ${translation.effect.reduced}`),
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
          value: renderStart(translate, translateMap, entry.start),
        },
        {
          label: translate("Duration"),
          value:
            renderDuration(translate, translateMap, entry.duration.default) +
            (entry.duration.reduced === undefined
              ? ""
              : ` / ${renderDuration(translate, translateMap, entry.duration.reduced)}`),
        },
        legality === undefined
          ? undefined
          : {
              label: translate("Legality"),
              value: legality,
            },
        renderValueCost(translate, translateMap, entry.cost, entry.value),
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
              label: `${translate("Prerequisites")} (${translate(
                "Brewing Process",
              )})`,
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
                      `${translate(
                        "Prerequisites",
                      )}: ${printPlainGeneralPrerequisites(
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
        note === undefined
          ? undefined
          : {
              label: translate("Note"),
              value: note,
            },
      ],
      errata: translation.errata,
      references: entry.src,
    }
  },
)
