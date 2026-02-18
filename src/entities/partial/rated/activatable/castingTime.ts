import { isNotNullish, mapNullable } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import {
  CastingTime,
  CastingTimeDuringLovemaking,
  CastingTimeIncludingLovemaking,
  FastCastingTime,
  FastSkillNonModifiableCastingTime,
  ModifiableCastingTime,
  SlowCastingTime,
  SlowSkillNonModifiableCastingTime,
} from "optolith-database-schema/gen"
import { Case } from "../../../../helpers/enums.js"
import type { GetInstanceById } from "../../../../helpers/getTypes.js"
import type { Translate } from "../../../../helpers/translate.js"
import { ResponsiveTextSize } from "../../responsiveText.js"
import { formatTimeSpan } from "../../units/timeSpan.js"
import { MISSING_VALUE } from "../../unknown.js"
import { Entity } from "./entity.js"
import {
  getNonModifiableSuffixTranslation,
  ModifiableParameter,
} from "./nonModifiableSuffix.js"
import { getMapModifiableBySpeed, Speed } from "./speed.js"

const getModifiableCastingTimeTranslation = (
  getInstanceById: GetInstanceById<"SkillModificationLevel">,
  translate: Translate,
  speed: Speed,
  responsiveTextSize: ResponsiveTextSize,
  value: ModifiableCastingTime,
): string =>
  mapNullable(
    getInstanceById("SkillModificationLevel", value.initial_modification_level),
    modificationLevel =>
      getMapModifiableBySpeed(
        config =>
          formatTimeSpan(
            translate,
            responsiveTextSize,
            Case("Actions"),
            config.casting_time,
          ),
        config =>
          formatTimeSpan(
            translate,
            responsiveTextSize,
            config.casting_time.unit,
            config.casting_time.value,
          ),
        speed,
        modificationLevel,
      ),
  ) ?? MISSING_VALUE

const getFastSkillNonModifiableCastingTimeTranslation = (
  translate: Translate,
  responsiveTextSize: ResponsiveTextSize,
  value: FastSkillNonModifiableCastingTime,
): string =>
  formatTimeSpan(translate, responsiveTextSize, Case("Actions"), value.actions)

/**
 * Get the text for a non-modifiable casting time of a slow activatable skill.
 */
export const getSlowSkillNonModifiableCastingTimeTranslation = (
  translate: Translate,
  responsiveTextSize: ResponsiveTextSize,
  value: SlowSkillNonModifiableCastingTime,
): string =>
  formatTimeSpan(translate, responsiveTextSize, value.unit, value.value)

/**
 * Translate casting time.
 */
export const getCastingTimeTranslation = <NonModifiable extends object>(
  getNonModifiableCastingTimeTranslation: (
    translate: Translate,
    responsiveTextSize: ResponsiveTextSize,
    value: NonModifiable,
  ) => string,
  speed: Speed,
  getInstanceById: GetInstanceById<"SkillModificationLevel">,
  translate: Translate,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: CastingTime<NonModifiable>,
): string => {
  switch (value.kind) {
    case "Modifiable":
      return getModifiableCastingTimeTranslation(
        getInstanceById,
        translate,
        speed,
        responsiveTextSize,
        value.Modifiable,
      )
    case "NonModifiable":
      return (
        getNonModifiableCastingTimeTranslation(
          translate,
          responsiveTextSize,
          value.NonModifiable,
        ) +
        getNonModifiableSuffixTranslation(
          translate,
          entity,
          ModifiableParameter.CastingTime,
          responsiveTextSize,
        )
      )
    default:
      return assertExhaustive(value)
  }
}

const getCastingTimeDuringLovemakingTranslation = (
  translate: Translate,
  responsiveTextSize: ResponsiveTextSize,
  value: CastingTimeDuringLovemaking,
): string =>
  formatTimeSpan(translate, responsiveTextSize, value.unit, value.value)

const getCastingTimeIncludingLovemakingTranslation = <
  NonModifiable extends object,
>(
  getNonModifiableCastingTimeTranslation: (
    translate: Translate,
    responsiveTextSize: ResponsiveTextSize,
    value: NonModifiable,
  ) => string,
  getInstanceById: GetInstanceById<"SkillModificationLevel">,
  translate: Translate,
  speed: Speed,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: CastingTimeIncludingLovemaking<NonModifiable>,
) =>
  [
    mapNullable(value.default, def =>
      getCastingTimeTranslation(
        getNonModifiableCastingTimeTranslation,
        speed,
        getInstanceById,
        translate,
        entity,
        responsiveTextSize,
        def,
      ),
    ),
    mapNullable(value.during_lovemaking, duringLovemaking =>
      getCastingTimeDuringLovemakingTranslation(
        translate,
        responsiveTextSize,
        duringLovemaking,
      ),
    ),
  ]
    .filter(isNotNullish)
    .join(" / ")

/**
 * Get the text for the casting time of a fast activatable skill.
 */
export const getFastCastingTimeTranslation = (
  getInstanceById: GetInstanceById<"SkillModificationLevel">,
  translate: Translate,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: FastCastingTime,
): string =>
  getCastingTimeIncludingLovemakingTranslation(
    getFastSkillNonModifiableCastingTimeTranslation,
    getInstanceById,
    translate,
    Speed.Fast,
    entity,
    responsiveTextSize,
    value,
  )

/**
 * Get the text for the casting time of a slow activatable skill.
 */
export const getSlowCastingTimeTranslation = (
  getInstanceById: GetInstanceById<"SkillModificationLevel">,
  translate: Translate,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: SlowCastingTime,
): string =>
  getCastingTimeIncludingLovemakingTranslation(
    getSlowSkillNonModifiableCastingTimeTranslation,
    getInstanceById,
    translate,
    Speed.Slow,
    entity,
    responsiveTextSize,
    value,
  )
