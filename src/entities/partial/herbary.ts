import { isNotEmpty } from "@elyukai/utils/array/nonEmpty"
import { on } from "@elyukai/utils/function"
import { compareNumber } from "@elyukai/utils/ordering"
import { Reader } from "@elyukai/utils/reader"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type {
  AlternativeName,
  LaboratoryLevel,
  Reduceable,
  Resistance,
} from "@optolith/database-schema/gen"
import type { StdEnv, StdReader } from "../../env.js"
import type { LocaleMap, Translate, TranslateMap } from "../../helpers/translate.js"
import { getDerivedCharacteristicPositionAndTranslation } from "./derivedCharacteristics.js"
import { renderDice } from "./dice.js"
import { parensIf } from "./rated/activatable/parensIf.js"
import { translateR } from "./reader.js"
import { ResponsiveTextSize } from "./responsiveText.js"

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
  resistance: Resistance,
): StdReader<string, "t" | "tm" | "ibi", "DerivedCharacteristic"> => {
  switch (resistance.kind) {
    case "Single":
      return getDerivedCharacteristicPositionAndTranslation(
        resistance.Single.derivedCharacteristic,
        "resistance",
      )
        .with((env: StdEnv<"tm" | "ibi", "DerivedCharacteristic">) => ({
          responsiveTextSize: ResponsiveTextSize.Full,
          ...env,
        }))
        .map(([, translation]) => translation)

    case "Minimum":
      return Reader.traverse(resistance.Minimum.derivedCharacteristics, id =>
        getDerivedCharacteristicPositionAndTranslation(id, "resistance"),
      )
        .with((env: StdEnv<"tm" | "ibi", "DerivedCharacteristic">) => ({
          responsiveTextSize: ResponsiveTextSize.Full,
          ...env,
        }))
        .thenW(list =>
          translateR("{$values :list type=disjunction}, depending on which value is lower", {
            values: list.toSorted(on(p => p[0], compareNumber)).map(p => p[1]),
          }),
        )

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
        valueRange: item.chance === 5 ? "1" : `1–${(item.chance / 5).toFixed()}`,
        dice: renderDice(translate, { number: 1, sides: 20 }),
      }) +
      (includePercentage
        ? `, ${translate(".input {$value :number} {{{$value}%}}", { value: item.chance })}`
        : ""))

/**
 * Renders a list of alternative names into a localized string, or returns undefined if there are no alternative names.
 */
export const renderAlternativeNames = (alternativeNames: AlternativeName[] | undefined) =>
  alternativeNames === undefined || !isNotEmpty(alternativeNames)
    ? undefined
    : {
        label: translateR(".input {$hiddenCount :number} {{Alternative Names}}", {
          hiddenCount: alternativeNames.length,
        }),
        value: Reader.of(
          alternativeNames.map(name => name.name + parensIf(name.region)).join(", "),
        ),
      }

/**
 * Renders a reduceable value into a localized string.
 */
export const renderReduceable = <T>(
  reducable: Reduceable<T>,
  renderValue: (value: T) => string,
) => {
  const defaultValue = renderValue(reducable.default)
  const reducedValue = reducable.reduced === undefined ? undefined : renderValue(reducable.reduced)
  const additionalText = reducable.additonal === undefined ? "" : `\n\n${reducable.additonal}`

  if (reducedValue === undefined) {
    return defaultValue + additionalText
  }

  return `${defaultValue} / ${reducedValue}${additionalText}`
}
