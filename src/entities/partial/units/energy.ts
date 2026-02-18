import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type { Translate, Translations } from "../../../helpers/translate.js"
import { Entity } from "../rated/activatable/entity.js"

type EnergyUnit = "ArcaneEnergy" | "KarmaPoints"

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

/**
 * Returns the text for an energy unit that is based on the entity type.
 */
export const formatEnergyByEntity = (
  translate: Translate,
  entity: Entity,
  value: number | string,
) => {
  switch (entity) {
    case Entity.Cantrip:
    case Entity.Spell:
    case Entity.Ritual:
      return formatEnergy(translate, "ArcaneEnergy", value)
    case Entity.Blessing:
    case Entity.LiturgicalChant:
    case Entity.Ceremony:
      return formatEnergy(translate, "KarmaPoints", value)
    default:
      return assertExhaustive(entity)
  }
}
