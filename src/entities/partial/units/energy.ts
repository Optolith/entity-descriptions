import type { Translate, Translations } from "../../../helpers/translate.js"

/**
 * The unit of an energy cost.
 */
export type EnergyUnit = "ArcaneEnergy" | "KarmaPoints"

const lengthUnitTranslationKeys = {
  ArcaneEnergy: "{$value} AE",
  KarmaPoints: "{$value} KP",
} as const satisfies {
  [key in EnergyUnit]: keyof Translations
}

/**
 * Returns the text for an energy unit.
 */
export const formatEnergy = (
  translate: Translate,
  unit: EnergyUnit,
  value: number | string,
): string => {
  const key = lengthUnitTranslationKeys[unit]

  return translate(key, { value })
}
