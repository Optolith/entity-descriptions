import { mapNullable } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type {
  BlessingRange,
  CantripRange,
  CheckResultBasedRange,
  FixedRange,
  ModifiableRange,
  Range,
  RangeValue,
} from "optolith-database-schema/gen"
import { type GetInstanceById } from "../../../../helpers/getTypes.js"
import type { Translate, TranslateMap } from "../../../../helpers/translate.js"
import {
  appendNoteIfRequested,
  replaceTextIfRequested,
  ResponsiveTextSize,
} from "../../responsiveText.js"
import { formatLength } from "../../units/length.js"
import { MISSING_VALUE } from "../../unknown.js"
import { getCheckResultBasedValueTranslation } from "./checkResultBased.js"
import { Entity } from "./entity.js"
import { wrapIfMaximum } from "./isMinimumMaximum.js"
import {
  getNonModifiableSuffixTranslation,
  ModifiableParameter,
} from "./nonModifiableSuffix.js"
import { getModifiableBySpeed, Speed } from "./speed.js"

const getModifiableRangeTranslation = (
  getInstanceById: GetInstanceById<"SkillModificationLevel">,
  translate: Translate,
  speed: Speed,
  responsiveTextSize: ResponsiveTextSize,
  value: ModifiableRange,
) =>
  mapNullable(
    getInstanceById("SkillModificationLevel", value.initial_modification_level),
    modificationLevel => {
      const range = getModifiableBySpeed(speed, "range", modificationLevel)

      if (range === 1) {
        return translate("Touch")
      }

      return formatLength(translate, responsiveTextSize, "Steps", range)
    },
  ) ?? MISSING_VALUE

const getSightTranslation = (translate: Translate) => translate("Sight")

const getSelfTranslation = (translate: Translate) => translate("Self")

const getGlobalTranslation = (translate: Translate) => translate("Global")

const getTouchTranslation = (
  translate: Translate,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
) =>
  translate("Touch") +
  getNonModifiableSuffixTranslation(
    translate,
    entity,
    ModifiableParameter.Range,
    responsiveTextSize,
  )

const getFixedRangeTranslation = (
  translate: Translate,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: FixedRange,
) =>
  formatLength(translate, responsiveTextSize, value.unit.kind, value.value) +
  getNonModifiableSuffixTranslation(
    translate,
    entity,
    ModifiableParameter.Range,
    responsiveTextSize,
  )

const wrapIfRadius = (
  translate: Translate,
  is_radius: boolean | undefined,
  text: string,
) => (is_radius === true ? `${text} ${translate("Radius")}` : text)

const getCheckResultBasedRangeTranslation = (
  translate: Translate,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: CheckResultBasedRange,
) => {
  const range = formatLength(
    translate,
    responsiveTextSize,
    value.unit.kind,
    getCheckResultBasedValueTranslation(translate, value),
  )

  const rangeWrappedIfRadius = wrapIfRadius(translate, value.is_radius, range)

  const rangeWrappedIfRadiusAndIfMaximum = wrapIfMaximum(
    translate,
    responsiveTextSize,
    value.is_maximum,
    rangeWrappedIfRadius,
  )

  return (
    rangeWrappedIfRadiusAndIfMaximum +
    getNonModifiableSuffixTranslation(
      translate,
      entity,
      ModifiableParameter.Range,
      responsiveTextSize,
    )
  )
}

/**
 * Returns the text for the range of an activatable skill.
 */
export const getRangeValueTranslation = (
  getInstanceById: GetInstanceById<"SkillModificationLevel">,
  translate: Translate,
  speed: Speed,
  responsiveTextSize: ResponsiveTextSize,
  entity: Entity,
  value: RangeValue,
) => {
  switch (value.kind) {
    case "Modifiable":
      return getModifiableRangeTranslation(
        getInstanceById,
        translate,
        speed,
        responsiveTextSize,
        value.Modifiable,
      )
    case "Sight":
      return getSightTranslation(translate)
    case "Self":
      return getSelfTranslation(translate)
    case "Global":
      return getGlobalTranslation(translate)
    case "Touch":
      return getTouchTranslation(translate, entity, responsiveTextSize)
    case "Fixed": {
      return getFixedRangeTranslation(
        translate,
        entity,
        responsiveTextSize,
        value.Fixed,
      )
    }
    case "CheckResultBased":
      return getCheckResultBasedRangeTranslation(
        translate,
        entity,
        responsiveTextSize,
        value.CheckResultBased,
      )
    default:
      return assertExhaustive(value)
  }
}

/**
 * Returns the text for the range of an activatable skill.
 */
export const getTextForActivatableSkillRange = (
  getInstanceById: GetInstanceById<"SkillModificationLevel">,
  translate: Translate,
  translateMap: TranslateMap,
  speed: Speed,
  responsiveTextSize: ResponsiveTextSize,
  entity: Entity,
  value: Range,
): string => {
  const rangeValue = getRangeValueTranslation(
    getInstanceById,
    translate,
    speed,
    responsiveTextSize,
    entity,
    value.value,
  )

  const withReplacement = replaceTextIfRequested(
    "replacement",
    value.translations,
    translateMap,
    responsiveTextSize,
    rangeValue,
  )

  return appendNoteIfRequested(
    "note",
    value.translations,
    translateMap,
    responsiveTextSize,
    withReplacement,
  )
}

const getTextForTinyActivatableRange = (
  translate: Translate,
  responsiveTextSize: ResponsiveTextSize,
  entity: Entity,
  value: CantripRange | BlessingRange,
): string => {
  switch (value.kind) {
    case "Self":
      return getSelfTranslation(translate)
    case "Touch":
      return getTouchTranslation(translate, entity, responsiveTextSize)
    case "Fixed":
      return getFixedRangeTranslation(
        translate,
        entity,
        responsiveTextSize,
        value.Fixed,
      )
    default:
      return assertExhaustive(value)
  }
}

/**
 * Returns the text for the range of a cantrip.
 */
export const getTextForCantripRange = (
  translate: Translate,
  responsiveTextSize: ResponsiveTextSize,
  value: CantripRange,
): string =>
  getTextForTinyActivatableRange(
    translate,
    responsiveTextSize,
    Entity.Cantrip,
    value,
  )

/**
 * Returns the text for the range of a blessing.
 */
export const getTextForBlessingRange = (
  translate: Translate,
  responsiveTextSize: ResponsiveTextSize,
  value: BlessingRange,
): string =>
  getTextForTinyActivatableRange(
    translate,
    responsiveTextSize,
    Entity.Blessing,
    value,
  )
