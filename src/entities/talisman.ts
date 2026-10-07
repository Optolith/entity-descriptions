import { Reader } from "@elyukai/utils/reader"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type {
  Talisman,
  TalismanCombatUse,
  TalismanDamage,
  TalismanTranslation,
  TalismanType,
} from "@optolith/database-schema/gen"
import { Case } from "tsondb/schema/gen"
import { createEntityDescriptionCreator } from "../creator.js"
import type { StdEnv, StdReader } from "../env.js"
import type { TranslateMap } from "../helpers/translate.js"
import type { WrapInNestedReaders } from "../nestedReaders.js"
import type { RawTabularEntityDescription } from "../rawEntityDescription.js"
import { createMeleeWeaponTableEntry, createRangedWeaponTableEntry } from "./equipment.js"
import { formatDerivedCharacteristicEnergyUnit } from "./partial/derivedCharacteristics.js"
import { renderDiceR } from "./partial/dice.js"
import { renderMathOperationR } from "./partial/mathOperation.js"
import { attributedCustomNameR, localeJoinR, translateR } from "./partial/reader.js"
import { ResponsiveTextSize } from "./partial/responsiveText.js"
import { formatTimeSpanR } from "./partial/units/timeSpan.js"
import { MISSING_VALUE } from "./partial/unknown.js"

const renderTalismanType = (type: TalismanType) => {
  switch (type.kind) {
    case "MainTalisman":
      return translateR("Main Talisman")
    case "MinorTalisman":
      return translateR("Minor Talisman")
    case "PowerfulTalisman":
      return translateR("Powerful Talisman")
    case "Regalia":
      return translateR("Regalia")
    case "Talisman":
      return translateR("Talisman")
    default:
      return assertExhaustive(type)
  }
}

const renderTalismanDamage = (damage: TalismanDamage) =>
  renderMathOperationR(damage, value => {
    switch (value.kind) {
      case "Constant":
        return Reader.of(value.Constant.toFixed())
      case "QualityLevels":
        return translateR("QL")
      case "Random":
        return renderDiceR(value.Random)
      default:
        return assertExhaustive(value)
    }
  })

const renderTalismanCombatUse = (
  entry: Talisman,
  translation: TalismanTranslation,
  translateMap: TranslateMap,
  combatUse: TalismanCombatUse | undefined,
): WrapInNestedReaders<
  StdEnv<
    "f" | "fn" | "t" | "tm" | "lj" | "ma" | "rts" | "ibi",
    | "Attribute"
    | "Ammunition"
    | "BlessedTradition"
    | "CloseCombatTechnique"
    | "Culture"
    | "MagicalTradition"
    | "Profession"
    | "Race"
    | "RangedCombatTechnique"
    | "Reach"
    | "Weapon"
  >,
  RawTabularEntityDescription<string>
>[] => {
  if (combatUse === undefined) {
    return []
  }

  const baseProperties = {
    type: "tabular" as const,
    title: translation.name,
    className: "equipment",
    errata: translation.errata,
    references: entry.src,
  }

  const combatUseTranslation = translateMap(combatUse.translations)
  const enhancedCombatUse = { ...combatUse, cost: Case("Invaluable", {}) }

  return [
    ...Object.entries(combatUse.meleeUses ?? {}).map(([combatTechniqueId, use]) =>
      createMeleeWeaponTableEntry(
        baseProperties,
        translation.name,
        "Weapon",
        enhancedCombatUse,
        combatUseTranslation ?? {},
        combatTechniqueId,
        use,
        renderTalismanDamage,
      ),
    ),
    ...Object.entries(combatUse.rangedUses ?? {}).map(([combatTechniqueId, use]) =>
      createRangedWeaponTableEntry(
        baseProperties,
        translation.name,
        "Weapon",
        enhancedCombatUse,
        combatUseTranslation ?? {},
        combatTechniqueId,
        use,
        renderTalismanDamage,
      ),
    ),
  ]
}

/**
 * Get a JSON representation of the rules text for a state.
 */
export const getTalismanEntityDescription = createEntityDescriptionCreator<
  "Talisman",
  StdEnv<
    "f" | "fn" | "t" | "tm" | "lc" | "lj" | "ma" | "rts" | "ibi",
    | "Attribute"
    | "Ammunition"
    | "BlessedTradition"
    | "CloseCombatTechnique"
    | "Culture"
    | "DerivedCharacteristic"
    | "MagicalTradition"
    | "Profession"
    | "Race"
    | "RangedCombatTechnique"
    | "Reach"
    | "Weapon"
  >
>((_, { translateMap }, { content: entry }) => {
  const translation = translateMap(entry.translations)

  if (translation === undefined) {
    return undefined
  }

  const { activation, type } = entry

  return [
    {
      title: translation.name,
      className: "state",
      body: [
        {
          type: "definitionList",
          items: [
            {
              label: translateR("Effect"),
              value: translation.effect,
            },
            activation === undefined
              ? undefined
              : {
                  label: translateR("Activation"),
                  value: Reader.traverse(activation, activationItem =>
                    attributedCustomNameR(
                      "talisman-activation",
                      t => formatDerivedCharacteristicEnergyUnit(activationItem.cost.value, t),
                      "DerivedCharacteristic",
                      activationItem.cost.unit,
                    )
                      .map(
                        unit => `${activationItem.cost.value.toFixed()} ${unit ?? MISSING_VALUE}`,
                      )
                      .thenW(cost =>
                        renderMathOperationR(
                          activationItem.duration.value,
                          (value): StdReader<string | number, "t"> => {
                            switch (value.kind) {
                              case "Constant":
                                return Reader.of(value.Constant)
                              case "QualityLevels":
                                return translateR("QL")
                              default:
                                return assertExhaustive(value)
                            }
                          },
                        )
                          .thenW(value =>
                            formatTimeSpanR(activationItem.duration.unit, value).with(
                              (env: StdEnv<"t" | "tm" | "f">) => ({
                                ...env,
                                responsiveTextSize: ResponsiveTextSize.Full,
                              }),
                            ),
                          )
                          .map(duration => `${cost}, ${duration}`),
                      ),
                  ).thenW(list => localeJoinR(list, "disjunction")),
                },
            type === undefined
              ? undefined
              : {
                  label: translateR("Type"),
                  value: renderTalismanType(type),
                },
          ],
        },
      ],
      errata: translation.errata,
      references: entry.src,
    },
    ...renderTalismanCombatUse(entry, translation, translateMap, entry.combatUse),
  ]
})
