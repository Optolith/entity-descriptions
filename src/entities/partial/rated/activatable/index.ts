import {
  FastOneTimePerformanceParameters,
  FastSustainedPerformanceParameters,
  SlowOneTimePerformanceParameters,
  SlowSustainedPerformanceParameters,
} from "optolith-database-schema/types/_ActivatableSkill"
import { GetById } from "../../../../helpers/getTypes.js"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { ResponsiveTextSize } from "../../responsiveText.js"
import {
  getFastCastingTimeTranslation,
  getSlowCastingTimeTranslation,
} from "./castingTime.js"
import {
  getOneTimeCostTranslation,
  getSustainedCostTranslation,
} from "./cost.js"
import {
  getDurationForOneTimeTranslation,
  getDurationForSustainedTranslation,
} from "./duration.js"
import { Entity } from "./entity.js"
import { getTextForActivatableSkillRange } from "./range.js"
import { Speed } from "./speed.js"

/**
 * Get the texts for all fast one-time performance parameters.
 */
export const getFastOneTimePerformanceParametersTranslations = (
  getSkillModificationLevelById: GetById.Static.SkillModificationLevel,
  locale: LocaleEnvironment,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: FastOneTimePerformanceParameters,
): {
  castingTime: string
  cost: string
  range: string
  duration: string
} => ({
  castingTime: getFastCastingTimeTranslation(
    getSkillModificationLevelById,
    locale,
    entity,
    responsiveTextSize,
    value.casting_time,
  ),
  cost: getOneTimeCostTranslation(
    getSkillModificationLevelById,
    locale,
    Speed.Fast,
    entity,
    responsiveTextSize,
    value.cost,
  ),
  range: getTextForActivatableSkillRange(
    getSkillModificationLevelById,
    locale,
    Speed.Fast,
    responsiveTextSize,
    entity,
    value.range,
  ),
  duration: getDurationForOneTimeTranslation(
    locale,
    responsiveTextSize,
    value.duration,
  ),
})

/**
 * Get the texts for all fast sustained performance parameters.
 */
export const getFastSustainedPerformanceParametersTranslations = (
  getSkillModificationLevelById: GetById.Static.SkillModificationLevel,
  locale: LocaleEnvironment,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: FastSustainedPerformanceParameters,
): {
  castingTime: string
  cost: string
  range: string
  duration: string
} => ({
  castingTime: getFastCastingTimeTranslation(
    getSkillModificationLevelById,
    locale,
    entity,
    responsiveTextSize,
    value.casting_time,
  ),
  cost: getSustainedCostTranslation(
    getSkillModificationLevelById,
    locale,
    Speed.Fast,
    entity,
    responsiveTextSize,
    value.cost,
  ),
  range: getTextForActivatableSkillRange(
    getSkillModificationLevelById,
    locale,
    Speed.Fast,
    responsiveTextSize,
    entity,
    value.range,
  ),
  duration: getDurationForSustainedTranslation(
    locale,
    responsiveTextSize,
    value.duration,
  ),
})

/**
 * Get the texts for all slow one-time performance parameters.
 */
export const getSlowOneTimePerformanceParametersTranslations = (
  getSkillModificationLevelById: GetById.Static.SkillModificationLevel,
  locale: LocaleEnvironment,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: SlowOneTimePerformanceParameters,
): {
  castingTime: string
  cost: string
  range: string
  duration: string
} => ({
  castingTime: getSlowCastingTimeTranslation(
    getSkillModificationLevelById,
    locale,
    entity,
    responsiveTextSize,
    value.casting_time,
  ),
  cost: getOneTimeCostTranslation(
    getSkillModificationLevelById,
    locale,
    Speed.Slow,
    entity,
    responsiveTextSize,
    value.cost,
  ),
  range: getTextForActivatableSkillRange(
    getSkillModificationLevelById,
    locale,
    Speed.Slow,
    responsiveTextSize,
    entity,
    value.range,
  ),
  duration: getDurationForOneTimeTranslation(
    locale,
    responsiveTextSize,
    value.duration,
  ),
})

/**
 * Get the texts for all slow sustained performance parameters.
 */
export const getSlowSustainedPerformanceParametersTranslations = (
  getSkillModificationLevelById: GetById.Static.SkillModificationLevel,
  locale: LocaleEnvironment,
  entity: Entity,
  responsiveTextSize: ResponsiveTextSize,
  value: SlowSustainedPerformanceParameters,
): {
  castingTime: string
  cost: string
  range: string
  duration: string
} => ({
  castingTime: getSlowCastingTimeTranslation(
    getSkillModificationLevelById,
    locale,
    entity,
    responsiveTextSize,
    value.casting_time,
  ),
  cost: getSustainedCostTranslation(
    getSkillModificationLevelById,
    locale,
    Speed.Slow,
    entity,
    responsiveTextSize,
    value.cost,
  ),
  range: getTextForActivatableSkillRange(
    getSkillModificationLevelById,
    locale,
    Speed.Slow,
    responsiveTextSize,
    entity,
    value.range,
  ),
  duration: getDurationForSustainedTranslation(
    locale,
    responsiveTextSize,
    value.duration,
  ),
})
