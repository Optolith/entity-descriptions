import {
  FastOneTimePerformanceParameters,
  FastSustainedPerformanceParameters,
  SlowOneTimePerformanceParameters,
  SlowSustainedPerformanceParameters,
} from "optolith-database-schema/types/_ActivatableSkill"
import { GetById } from "../../../../helpers/getTypes.js"
import { Translate, TranslateMap } from "../../../../helpers/translate.js"
import { ResponsiveTextSize } from "../../responsiveText.js"
import {
  getTextForFastCastingTime,
  getTextForSlowCastingTime,
} from "./castingTime.js"
import { getTextForOneTimeCost, getTextForSustainedCost } from "./cost.js"
import {
  getTextForDurationForOneTime,
  getTextForDurationForSustained,
} from "./duration.js"
import { Entity } from "./entity.js"
import { getTextForActivatableSkillRange } from "./range.js"
import { Speed } from "./speed.js"

/**
 * Get the texts for all fast one-time performance parameters.
 */
export const getTextForFastOneTimePerformanceParameters = (
  deps: {
    getSkillModificationLevelById: GetById.Static.SkillModificationLevel
    translate: Translate
    translateMap: TranslateMap
  },
  value: FastOneTimePerformanceParameters,
  env: {
    entity: Entity
    responsiveText: ResponsiveTextSize
  }
): {
  castingTime: string
  cost: string
  range: string
  duration: string
} => ({
  castingTime: getTextForFastCastingTime(deps, value.casting_time, env),
  cost: getTextForOneTimeCost(deps, value.cost, { speed: Speed.Fast, ...env }),
  range: getTextForActivatableSkillRange(deps, value.range, {
    speed: Speed.Fast,
    ...env,
  }),
  duration: getTextForDurationForOneTime(deps, value.duration, env),
})

/**
 * Get the texts for all fast sustained performance parameters.
 */
export const getTextForFastSustainedPerformanceParameters = (
  deps: {
    getSkillModificationLevelById: GetById.Static.SkillModificationLevel
    translate: Translate
    translateMap: TranslateMap
  },
  value: FastSustainedPerformanceParameters,
  env: {
    entity: Entity
    responsiveText: ResponsiveTextSize
  }
): {
  castingTime: string
  cost: string
  range: string
  duration: string
} => ({
  castingTime: getTextForFastCastingTime(deps, value.casting_time, env),
  cost: getTextForSustainedCost(deps, value.cost, {
    speed: Speed.Fast,
    ...env,
  }),
  range: getTextForActivatableSkillRange(deps, value.range, {
    speed: Speed.Fast,
    ...env,
  }),
  duration: getTextForDurationForSustained(deps, value.duration, env),
})

/**
 * Get the texts for all slow one-time performance parameters.
 */
export const getTextForSlowOneTimePerformanceParameters = (
  deps: {
    getSkillModificationLevelById: GetById.Static.SkillModificationLevel
    translate: Translate
    translateMap: TranslateMap
  },
  value: SlowOneTimePerformanceParameters,
  env: {
    entity: Entity
    responsiveText: ResponsiveTextSize
  }
): {
  castingTime: string
  cost: string
  range: string
  duration: string
} => ({
  castingTime: getTextForSlowCastingTime(deps, value.casting_time, env),
  cost: getTextForOneTimeCost(deps, value.cost, { speed: Speed.Slow, ...env }),
  range: getTextForActivatableSkillRange(deps, value.range, {
    speed: Speed.Slow,
    ...env,
  }),
  duration: getTextForDurationForOneTime(deps, value.duration, env),
})

/**
 * Get the texts for all slow sustained performance parameters.
 */
export const getTextForSlowSustainedPerformanceParameters = (
  deps: {
    getSkillModificationLevelById: GetById.Static.SkillModificationLevel
    translate: Translate
    translateMap: TranslateMap
  },
  value: SlowSustainedPerformanceParameters,
  env: {
    entity: Entity
    responsiveText: ResponsiveTextSize
  }
): {
  castingTime: string
  cost: string
  range: string
  duration: string
} => ({
  castingTime: getTextForSlowCastingTime(deps, value.casting_time, env),
  cost: getTextForSustainedCost(deps, value.cost, {
    speed: Speed.Slow,
    ...env,
  }),
  range: getTextForActivatableSkillRange(deps, value.range, {
    speed: Speed.Slow,
    ...env,
  }),
  duration: getTextForDurationForSustained(deps, value.duration, env),
})
