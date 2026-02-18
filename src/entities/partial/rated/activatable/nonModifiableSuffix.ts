import { mapNullable } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type { Translate, Translations } from "../../../../helpers/translate.js"
import { responsive, ResponsiveTextSize } from "../../responsiveText.js"
import { Entity } from "./entity.js"

/**
 * A parameter that is designed to be modifiable.
 */
export enum ModifiableParameter {
  CastingTime,
  Cost,
  Range,
}

const translationKeyForNonModifiableSuffix = {
  [Entity.Spell]: {
    [ModifiableParameter.CastingTime]:
      " (you cannot use a modification on this spell’s casting time)",
    [ModifiableParameter.Cost]:
      " (you cannot use a modification on this spell’s cost)",
    [ModifiableParameter.Range]:
      " (you cannot use a modification on this spell’s range)",
  },
  [Entity.Ritual]: {
    [ModifiableParameter.CastingTime]:
      " (you cannot use a modification on this ritual’s ritual time)",
    [ModifiableParameter.Cost]:
      " (you cannot use a modification on this ritual’s cost)",
    [ModifiableParameter.Range]:
      " (you cannot use a modification on this ritual’s range)",
  },
  [Entity.LiturgicalChant]: {
    [ModifiableParameter.CastingTime]:
      " (you cannot use a modification on this chant’s liturgical time)",
    [ModifiableParameter.Cost]:
      " (you cannot use a modification on this chant’s cost)",
    [ModifiableParameter.Range]:
      " (you cannot use a modification on this chant’s range)",
  },
  [Entity.Ceremony]: {
    [ModifiableParameter.CastingTime]:
      " (you cannot use a modification on this ceremony’s ceremonial time)",
    [ModifiableParameter.Cost]:
      " (you cannot use a modification on this ceremony’s cost)",
    [ModifiableParameter.Range]:
      " (you cannot use a modification on this ceremony’s range)",
  },
  [Entity.Cantrip]: undefined,
  [Entity.Blessing]: undefined,
} satisfies {
  [entityKey in Entity]:
    | {
        [paramKey in ModifiableParameter]: keyof Translations
      }
    | undefined
}

/**
 * Returns the suffix for the text of a non-modifiable parameter that indicates
 * that the parameter cannot be modified.
 */
export const getNonModifiableSuffixTranslation = (
  translate: Translate,
  entity: Entity,
  param: ModifiableParameter,
  responsiveTextSize: ResponsiveTextSize,
): string =>
  responsive(
    responsiveTextSize,
    () =>
      mapNullable(translationKeyForNonModifiableSuffix[entity]?.[param], key =>
        translate(key),
      ) ?? "",
    () => {
      switch (entity) {
        case Entity.Spell:
        case Entity.Ritual:
        case Entity.LiturgicalChant:
        case Entity.Ceremony:
          return translate(" (cannot modify)")
        case Entity.Cantrip:
        case Entity.Blessing:
          return ""
        default:
          return assertExhaustive(entity)
      }
    },
  )
