import { assertExhaustive } from "@optolith/helpers/typeSafety"
import { UI } from "optolith-database-schema/types/UI"
import { LocaleEnvironment } from "../../../helpers/locale.js"
import { Entity } from "../rated/activatable/entity.js"

type EnergyUnit = "ArcaneEnergy" | "KarmaPoints"

const lengthUnitTranslationKeys: {
  [key in EnergyUnit]: keyof UI
} = {
  ArcaneEnergy: "{0} AE",
  KarmaPoints: "{0} KP",
}

/**
 * Returns the text for an energy unit.
 */
export const formatEnergy = (
  locale: LocaleEnvironment,
  unit: EnergyUnit,
  value: number | string
): string => {
  const key = lengthUnitTranslationKeys[unit]

  return locale.translate(key, value)
}

/**
 * Returns the text for an energy unit that is based on the entity type.
 */
export const formatEnergyByEntity = (
  locale: LocaleEnvironment,
  entity: Entity,
  value: number | string
) => {
  switch (entity) {
    case Entity.Cantrip:
    case Entity.Spell:
    case Entity.Ritual:
      return formatEnergy(locale, "ArcaneEnergy", value)
    case Entity.Blessing:
    case Entity.LiturgicalChant:
    case Entity.Ceremony:
      return formatEnergy(locale, "KarmaPoints", value)
    default:
      return assertExhaustive(entity)
  }
}
