import { on } from "@elyukai/utils/function"
import { isNotNullish } from "@elyukai/utils/nullable"
import { compareNumber, reduceCompare } from "@elyukai/utils/ordering"
import { Reader } from "@elyukai/utils/reader"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type {
  ApplicableAmmunitionCategory,
  ApplicableArmorCategory,
  ApplicableItems,
  ApplicableMeleeCombatTechnique,
  ApplicableMeleeWeaponCategory,
  Armor_ID,
  ItemComponent_ID,
  ItemComponentCost,
  MathOperation,
  Weapon_ID,
} from "@optolith/database-schema/gen"
import { Case } from "tsondb/schema/gen"
import { createEntityDescriptionCreator } from "../creator.js"
import type { StdEnv, StdReader } from "../env.js"
import { renderFixedItemCost } from "./equipment.js"
import { renderValueMap } from "./partial/map.js"
import { renderMathOperationR } from "./partial/mathOperation.js"
import { parensIfR } from "./partial/rated/activatable/parensIf.js"
import {
  attributedNameR,
  formatNumber,
  getChildInstancesForInstanceIdR,
  localeCompareR,
  localeJoinR,
  localeSortR,
  sequence,
  translateMapR,
  translateR,
} from "./partial/reader.js"
import { ResponsiveTextSize } from "./partial/responsiveText.js"
import { formatArbitrarySilverthalers, formatSilverthalers } from "./partial/units/simple.js"
import { formatTimeSpanR } from "./partial/units/timeSpan.js"
import { MISSING_VALUE, UNHANDLED_VALUE } from "./partial/unknown.js"

const renderFactor = (factor: number): StdReader<string, "t" | "fn"> =>
  factor < 1
    ? translateR(".input {$value :number} {{{$value}%}}", { value: factor * 100 })
    : formatNumber(factor)

const renderItemComponentCost = (
  id: string,
  cost: ItemComponentCost,
): StdReader<
  string,
  "t" | "tm" | "fn" | "lc" | "rts" | "acibp" | "ibi",
  "CloseCombatTechnique" | "RangedCombatTechnique",
  never,
  "ItemComponentOption"
> => {
  switch (cost.kind) {
    case "ByCombatTechnique": {
      const close = Reader.traverse(
        Object.entries(cost.ByCombatTechnique.close ?? {}),
        ([closeId, costForTechnique]) =>
          translateMapR(costForTechnique.translations)
            .thenW(translation =>
              translation?.label === undefined
                ? attributedNameR("cost", "CloseCombatTechnique", closeId).map(
                    name => name ?? MISSING_VALUE,
                  )
                : Reader.of(translation.label),
            )
            .map((name): [number, string] => [costForTechnique.value, name]),
      )

      const ranged = Reader.traverse(
        Object.entries(cost.ByCombatTechnique.ranged ?? {}),
        ([rangedId, costForTechnique]) =>
          translateMapR(costForTechnique.translations)
            .thenW(translation =>
              translation?.label === undefined
                ? attributedNameR("cost", "RangedCombatTechnique", rangedId).map(
                    name => name ?? MISSING_VALUE,
                  )
                : Reader.of(translation.label),
            )
            .map((name): [number, string] => [costForTechnique.value, name]),
      )

      return close
        .thenW(closeEntries =>
          ranged.thenW(rangedEntries => {
            const allEntries = [...closeEntries, ...rangedEntries]

            return localeCompareR.map(localeCompare =>
              allEntries.sort(
                reduceCompare(
                  on(p => p[0], compareNumber),
                  on(p => p[1], localeCompare),
                ),
              ),
            )
          }),
        )
        .thenW(list =>
          Reader.traverse(list, ([costForTechnique, name]) =>
            formatSilverthalers(costForTechnique).map(
              formattedCost => `${formattedCost} (${name})`,
            ),
          ),
        )
        .map(list => list.join(", "))
    }
    case "DerivedFromOption":
      return getChildInstancesForInstanceIdR("ItemComponentOption", id).thenW(options =>
        renderValueMap(
          {
            options,
            style: Case("Verbose"),
          },
          option => Reader.of(option.content.cost),
          option =>
            translateMapR(option.content.translations).map(
              translation => translation?.label ?? MISSING_VALUE,
            ),
          formatArbitrarySilverthalers,
        ),
      )
    case "Factor":
      return translateR("Price").thenW(price =>
        renderFactor(cost.Factor).thenW(value =>
          renderMathOperationR<string, string, unknown>(
            Case<"Multiplication", [MathOperation<string>, MathOperation<string>]>(
              "Multiplication",
              [Case("Value", price), Case("Value", value)],
            ),
            Reader.of,
          ),
        ),
      )
    case "Fixed":
      return renderFixedItemCost(cost.Fixed)
    default:
      return assertExhaustive(cost)
  }
}

const renderMeleeWeaponCategory = (
  category: ApplicableMeleeWeaponCategory | undefined,
): StdReader<string | undefined, "t"> => {
  if (category === undefined) {
    return Reader.of(undefined)
  }

  switch (category.kind) {
    case "HasMetalBladeOrTip":
      return translateR("all weapons with metal blades or tips")
    case "HasMetalSurface":
      return translateR("all weapons with a metal surface")
    case "HasWrappableHandle":
      return translateR("all weapons with a handle that can be wrapped with leather")
    default:
      return assertExhaustive(category)
  }
}

const renderApplicableWeapons = <E extends "Weapon" | "SpecialAmmunition">(
  entity: E,
  armor: Weapon_ID[] | undefined,
): StdReader<string[] | undefined, "tm" | "lc" | "ibi", E> => {
  if (armor === undefined) {
    return Reader.of(undefined)
  }

  return Reader.traverse(armor, armorId =>
    attributedNameR("applicable-items", entity, armorId).map(name => name ?? MISSING_VALUE),
  ).thenW(localeSortR)
}

const renderApplicableCombatTechniques = <
  E extends "CloseCombatTechnique" | "RangedCombatTechnique",
>(
  entity: E,
  combatTechniques: ApplicableMeleeCombatTechnique[] | undefined,
): StdReader<string | undefined, "tm" | "lc" | "ibi", E> => {
  if (combatTechniques === undefined) {
    return Reader.of(undefined)
  }

  return Reader.traverse(combatTechniques, combatTechniqueConfig =>
    translateMapR(combatTechniqueConfig.translations).thenW(translation =>
      translation?.text === undefined
        ? attributedNameR("applicable-items", entity, combatTechniqueConfig.combatTechnique).map(
            name => name ?? MISSING_VALUE,
          )
        : Reader.of(translation.text),
    ),
  )
    .thenW(localeSortR)
    .map(list => list.join(", "))
}

const renderMinimumReloadTime = (
  minimumReloadTime: number | undefined,
): StdReader<string | undefined, "t" | "tm" | "f" | "rts"> =>
  minimumReloadTime === undefined
    ? Reader.of(undefined)
    : formatTimeSpanR("Actions", minimumReloadTime).thenW(timeSpan =>
        translateR("only models with a reload time of at least {$timeSpan}", { timeSpan }),
      )

const renderUsesBullets = (
  weapons: string,
  usesBullets: boolean | undefined,
): StdReader<string, "t"> =>
  usesBullets === true
    ? translateR("{$weapons} that use bullets as ammunition", { weapons })
    : Reader.of(weapons)

const renderArmorCategory = (
  category: ApplicableArmorCategory | undefined,
): StdReader<string | undefined, "t"> => {
  if (category === undefined) {
    return Reader.of(undefined)
  }

  if (category.kind === "Metal") {
    return translateR("all metal armor")
  }

  return Reader.of(UNHANDLED_VALUE)
}

const renderSpecificArmor = (
  armor: Armor_ID[] | undefined,
): StdReader<string[] | undefined, "tm" | "lc" | "ibi", "Armor"> => {
  if (armor === undefined) {
    return Reader.of(undefined)
  }

  return Reader.traverse(armor, armorId =>
    attributedNameR("applicable-items", "Armor", armorId).map(name => name ?? MISSING_VALUE),
  ).thenW(localeSortR)
}

const renderApplicableAmmunitionBase = (
  category: ApplicableAmmunitionCategory | undefined,
): StdReader<string, "t"> => {
  if (category === undefined) {
    return translateR("all ammunition types")
  }

  if (category.kind === "ArrowOrBolt") {
    return translateR("all arrow and bolt types")
  }

  return Reader.of(UNHANDLED_VALUE)
}

const renderApplicableItems = (
  applicableItems: ApplicableItems,
): StdReader<
  string,
  "t" | "tm" | "lc" | "lj" | "f" | "rts" | "ibi",
  "Armor" | "CloseCombatTechnique" | "RangedCombatTechnique" | "Weapon" | "SpecialAmmunition"
> => {
  switch (applicableItems.kind) {
    case "MeleeWeapon": {
      const category = renderMeleeWeaponCategory(applicableItems.MeleeWeapon.category)
      const combatTechniques = renderApplicableCombatTechniques(
        "CloseCombatTechnique",
        applicableItems.MeleeWeapon.combatTechniques,
      )
      const weapons = renderApplicableWeapons("Weapon", applicableItems.MeleeWeapon.weapons)
      return Reader.sequence<
        StdEnv<"t" | "tm" | "lc" | "ibi", "CloseCombatTechnique" | "Weapon">,
        string | string[] | undefined
      >([category, combatTechniques, weapons]).map(list =>
        list.filter(isNotNullish).flat().join(", "),
      )
    }
    case "RangedWeapon": {
      const combatTechniques = renderApplicableCombatTechniques(
        "RangedCombatTechnique",
        applicableItems.RangedWeapon.combatTechniques,
      )
      const weapons = renderApplicableWeapons("Weapon", applicableItems.RangedWeapon.weapons)
      return Reader.sequence<
        StdEnv<"tm" | "lc" | "ibi", "RangedCombatTechnique" | "Weapon">,
        string | string[] | undefined
      >([combatTechniques, weapons])
        .map(list => list.filter(isNotNullish).flat().join(", "))
        .thenW(list => renderUsesBullets(list, applicableItems.RangedWeapon.usesBullets))
        .thenW(
          list =>
            sequence`${list}${parensIfR(
              renderMinimumReloadTime(applicableItems.RangedWeapon.minimumReloadTime),
            )}`,
        )
    }
    case "Ammunition":
      return renderApplicableAmmunitionBase(applicableItems.Ammunition.category).thenW(base =>
        renderApplicableWeapons("SpecialAmmunition", applicableItems.Ammunition.ammunition).thenW(
          ammunition =>
            applicableItems.Ammunition.category === undefined && ammunition
              ? Reader.of(ammunition.join(", "))
              : applicableItems.Ammunition.invertAmmunition === true && ammunition
                ? sequence`${base} ${translateR("except for {$list :list type=conjunction}", { list: ammunition })}`
                : Reader.of([base, ammunition].filter(isNotNullish).flat().join(", ")),
        ),
      )
    case "Armor": {
      if (
        applicableItems.Armor.category === undefined &&
        applicableItems.Armor.armor === undefined
      ) {
        return translateR("all armor")
      }

      const specificArmor = renderSpecificArmor(applicableItems.Armor.armor)
      const category = renderArmorCategory(applicableItems.Armor.category)

      return category.thenW(cat => specificArmor.map((list = []) => [cat, ...list].join(", ")))
    }
    default:
      return assertExhaustive(applicableItems)
  }
}

const renderIncompatibleItems = (
  name: string,
  incompatibleWith: ItemComponent_ID[] | undefined,
): StdReader<string | undefined, "t" | "tm" | "lj" | "lc" | "ibi", "ItemComponent"> =>
  incompatibleWith === undefined
    ? Reader.of(undefined)
    : Reader.traverse(incompatibleWith, id =>
        attributedNameR("incompatible-with", "ItemComponent", id).map(
          otherName => otherName ?? MISSING_VALUE,
        ),
      )
        .thenW(localeSortR)
        .thenW(list => localeJoinR(list, "conjunction"))
        .thenW(otherComponents =>
          translateR(
            ".input {$otherComponentsCount :number} {{{$itemComponent} cannot be combined with item components {$otherComponents}}}",
            {
              itemComponent: name,
              otherComponentsCount: incompatibleWith.length,
              otherComponents,
            },
          ),
        )

/**
 * Get a JSON representation of the rules text for equipment.
 */
export const getItemComponentEntityDescription = createEntityDescriptionCreator<
  "ItemComponent",
  StdEnv<
    "f" | "fn" | "t" | "tm" | "lj" | "lc" | "acibp" | "ibi",
    | "Armor"
    | "CloseCombatTechnique"
    | "RangedCombatTechnique"
    | "Weapon"
    | "ItemComponent"
    | "SpecialAmmunition",
    never,
    "ItemComponentOption"
  >
>((_env, locale, entry) => {
  const { translateMap } = locale

  const translation = translateMap(entry.content.translations)

  if (translation === undefined) {
    return undefined
  }

  return {
    title: translation.name,
    className: "item-component",
    body: [
      {
        type: "definitionList",
        items: [
          {
            label: translateR("Rules"),
            value: translation.rules,
          },
          {
            label: translateR("Cost"),
            value: renderItemComponentCost(entry.id, entry.content.cost).with(innerEnv => ({
              ...innerEnv,
              responsiveTextSize: ResponsiveTextSize.Full,
            })),
          },
          {
            label:
              entry.content.applicableItems.kind === "Armor"
                ? translateR("Armor")
                : translateR("Weapons"),
            value:
              translation.applicableItems ??
              renderApplicableItems(entry.content.applicableItems)
                .with((innerEnv: Omit<typeof _env, "responsiveTextSize">) => ({
                  ...innerEnv,
                  responsiveTextSize: ResponsiveTextSize.Full,
                }))
                .thenW(applicableItems =>
                  renderIncompatibleItems(translation.name, entry.content.incompatibleWith).map(
                    incompatibleItems =>
                      [applicableItems, incompatibleItems].filter(isNotNullish).join(", "),
                  ),
                ),
          },
        ],
      },
    ],
    errata: translation.errata,
    references: entry.content.src,
  }
})
