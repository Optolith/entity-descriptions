import type {
  FastOneTimePerformanceParameters,
  FastSustainedPerformanceParameters,
  SlowOneTimePerformanceParameters,
  SlowSustainedPerformanceParameters,
} from "optolith-database-schema/gen"
import type { GetInstanceById } from "../../../../helpers/getTypes.js"
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
  getInstanceById: GetInstanceById<"SkillModificationLevel">,
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
    getInstanceById,
    locale,
    entity,
    responsiveTextSize,
    value.casting_time,
  ),
  cost: getOneTimeCostTranslation(
    getInstanceById,
    locale,
    Speed.Fast,
    entity,
    responsiveTextSize,
    value.cost,
  ),
  range: getTextForActivatableSkillRange(
    getInstanceById,
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
  getInstanceById: GetInstanceById<"SkillModificationLevel">,
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
    getInstanceById,
    locale,
    entity,
    responsiveTextSize,
    value.casting_time,
  ),
  cost: getSustainedCostTranslation(
    getInstanceById,
    locale,
    Speed.Fast,
    entity,
    responsiveTextSize,
    value.cost,
  ),
  range: getTextForActivatableSkillRange(
    getInstanceById,
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
  getInstanceById: GetInstanceById<"SkillModificationLevel">,
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
    getInstanceById,
    locale,
    entity,
    responsiveTextSize,
    value.casting_time,
  ),
  cost: getOneTimeCostTranslation(
    getInstanceById,
    locale,
    Speed.Slow,
    entity,
    responsiveTextSize,
    value.cost,
  ),
  range: getTextForActivatableSkillRange(
    getInstanceById,
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
  getInstanceById: GetInstanceById<"SkillModificationLevel">,
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
    getInstanceById,
    locale,
    entity,
    responsiveTextSize,
    value.casting_time,
  ),
  cost: getSustainedCostTranslation(
    getInstanceById,
    locale,
    Speed.Slow,
    entity,
    responsiveTextSize,
    value.cost,
  ),
  range: getTextForActivatableSkillRange(
    getInstanceById,
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
