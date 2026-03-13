import { isNotEmpty } from "@elyukai/utils/array/nonEmpty"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type { AlternativeName, LaboratoryLevel, Resistance } from "optolith-database-schema/gen"
import type { GetInstanceById } from "../../helpers/getTypes.js"
import type { LocaleMap, Translate, TranslateMap } from "../../helpers/translate.js"
import type { IdMap } from "../../index.js"
import { renderDice } from "./dice.js"
import { parensIf } from "./rated/activatable/parensIf.js"
import { MISSING_VALUE } from "./unknown.js"

/**
 * Renders a laboratory level into a localized string.
 */
export const renderLaboratoryLevel = (translate: Translate, level: LaboratoryLevel) => {
  switch (level.kind) {
    case "ArchaicLaboratory":
      return translate("Archaic laboratory")
    case "WitchKitchen":
      return translate("Witch kitchen")
    case "AlchemistsLaboratory":
      return translate("Alchemist’s laboratory")
    default:
      return assertExhaustive(level)
  }
}

/**
 * Renders a resistance into a localized string.
 */
export const renderResistance = (
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
          getInstanceById("DerivedCharacteristic", idMap.DerivedCharacteristic.Spirit)
            ?.translations,
        )?.name ?? MISSING_VALUE
      )

    case "Toughness":
      return (
        translateMap(
          getInstanceById("DerivedCharacteristic", idMap.DerivedCharacteristic.Toughness)
            ?.translations,
        )?.name ?? MISSING_VALUE
      )

    case "LowerOfSpiritAndToughness": {
      const spiritTranslation =
        translateMap(
          getInstanceById("DerivedCharacteristic", idMap.DerivedCharacteristic.Spirit)
            ?.translations,
        )?.name ?? MISSING_VALUE
      const toughnessTranslation =
        translateMap(
          getInstanceById("DerivedCharacteristic", idMap.DerivedCharacteristic.Toughness)
            ?.translations,
        )?.name ?? MISSING_VALUE
      return translate("{$first} or {$second}, depending on which value is lower", {
        first: spiritTranslation,
        second: toughnessTranslation,
      })
    }

    default:
      return assertExhaustive(resistance)
  }
}

/**
 * Renders a chance value into a localized string.
 */
export const renderChance = (
  translate: Translate,
  translateMap: TranslateMap,
  item: { chance?: number; translations?: LocaleMap<{ chance?: string }> },
  includePercentage = false,
) =>
  translateMap(item.translations)?.chance ??
  (item.chance === undefined
    ? undefined
    : translate("{$valueRange} on {$dice}", {
        valueRange: item.chance === 5 ? 1 : `1–${(item.chance / 5).toFixed()}`,
        dice: renderDice(translate, { number: 1, sides: 20 }),
      }) +
      (includePercentage
        ? `, ${translate(".input {$value :number} {{{$value}%}}", { value: item.chance })}`
        : ""))

/**
 * Renders a list of alternative names into a localized string, or returns undefined if there are no alternative names.
 */
export const renderAlternativeNames = (
  translate: Translate,
  alternativeNames: AlternativeName[] | undefined,
) =>
  alternativeNames === undefined || !isNotEmpty(alternativeNames)
    ? undefined
    : {
        label: translate(".input {$hiddenCount :number} {{Alternative Names}}", {
          hiddenCount: alternativeNames.length,
        }),
        value: alternativeNames.map(name => name.name + parensIf(name.region)).join(", "),
      }
