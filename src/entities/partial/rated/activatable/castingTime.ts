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
} from "optolith-database-schema/types/_ActivatableSkillCastingTime"
import { GetById } from "../../../../helpers/getTypes.js"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { ResponsiveTextSize } from "../../responsiveText.js"
import { formatTimeSpan } from "../../units/timeSpan.js"
import { MISSING_VALUE } from "../../unknown.js"
import { Entity } from "./entity.js"
import {
  getNonModifiableSuffixTranslation,
  ModifiableParameter,
} from "./nonModifiableSuffix.js"
import { getModifiableBySpeed, Speed } from "./speed.js"

const getModifiableCastingTimeTranslation = (
  getSkillModificationLevelById: GetById.Static.SkillModificationLevel,
  locale: LocaleEnvironment,
  speed: Speed,
  responsiveTextSize: ResponsiveTextSize,
  value: ModifiableCastingTime,
): string =>
  mapNullable(
    getSkillModificationLevelById(value.initial_modification_level),
    modificationLevel =>
      getModifiableBySpeed(
        config =>
          formatTimeSpan(
            locale,
            responsiveTextSize,
            "Actions",
            config.casting_time,
          ),
        config =>
          formatTimeSpan(
            locale,
            responsiveTextSize,
            config.casting_time.unit,
            config.casting_time.value,
          ),
        speed,
        modificationLevel,
      ),
  ) ?? MISSING_VALUE

const getFastSkillNonModifiableCastingTimeTranslation = (
  locale: LocaleEnvironment,
  responsiveTextSize: ResponsiveTextSize,
  value: FastSkillNonModifiableCastingTime,
): string =>
  formatTimeSpan(locale, responsiveTextSize, "Actions", value.actions)

const getSlowSkillNonModifiableCastingTimeTranslation = (
  locale: LocaleEnvironment,
  responsiveTextSize: ResponsiveTextSize,
  value: SlowSkillNonModifiableCastingTime,
): string => formatTimeSpan(locale, responsiveTextSize, value.unit, value.value)

const getCastingTimeTranslation = <NonModifiable extends object>(
  getNonModifiableCastingTimeTranslation: (value: NonModifiable) => string,
  getSkillModificationLevelById: GetById.Static.SkillModificationLevel,
  locale: LocaleEnvironment,
  speed: Speed,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: CastingTime<NonModifiable>,
): string => {
  switch (value.tag) {
    case "Modifiable":
      return getModifiableCastingTimeTranslation(
        getSkillModificationLevelById,
        locale,
        speed,
        responsiveTextSize,
        value.modifiable,
      )
    case "NonModifiable":
      return (
        getNonModifiableCastingTimeTranslation(value.non_modifiable) +
        getNonModifiableSuffixTranslation(
          locale,
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
  locale: LocaleEnvironment,
  responsiveTextSize: ResponsiveTextSize,
  value: CastingTimeDuringLovemaking,
): string => formatTimeSpan(locale, responsiveTextSize, value.unit, value.value)

const getCastingTimeIncludingLovemakingTranslation = <
  NonModifiable extends object,
>(
  getNonModifiableCastingTimeTranslation: (value: NonModifiable) => string,
  getSkillModificationLevelById: GetById.Static.SkillModificationLevel,
  locale: LocaleEnvironment,
  speed: Speed,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: CastingTimeIncludingLovemaking<NonModifiable>,
) =>
  [
    mapNullable(value.default, def =>
      getCastingTimeTranslation(
        getNonModifiableCastingTimeTranslation,
        getSkillModificationLevelById,
        locale,
        speed,
        entity,
        responsiveTextSize,
        def,
      ),
    ),
    mapNullable(value.during_lovemaking, duringLovemaking =>
      getCastingTimeDuringLovemakingTranslation(
        locale,
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
  getSkillModificationLevelById: GetById.Static.SkillModificationLevel,
  locale: LocaleEnvironment,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: FastCastingTime,
): string =>
  getCastingTimeIncludingLovemakingTranslation(
    nonModifiableValue =>
      getFastSkillNonModifiableCastingTimeTranslation(
        locale,
        responsiveTextSize,
        nonModifiableValue,
      ),
    getSkillModificationLevelById,
    locale,
    Speed.Fast,
    entity,
    responsiveTextSize,
    value,
  )

/**
 * Get the text for the casting time of a slow activatable skill.
 */
export const getSlowCastingTimeTranslation = (
  getSkillModificationLevelById: GetById.Static.SkillModificationLevel,
  locale: LocaleEnvironment,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: SlowCastingTime,
): string =>
  getCastingTimeIncludingLovemakingTranslation(
    nonModifiableValue =>
      getSlowSkillNonModifiableCastingTimeTranslation(
        locale,
        responsiveTextSize,
        nonModifiableValue,
      ),
    getSkillModificationLevelById,
    locale,
    Speed.Slow,
    entity,
    responsiveTextSize,
    value,
  )
