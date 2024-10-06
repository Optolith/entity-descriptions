import { assertExhaustive } from "@optolith/helpers/typeSafety"
import {
  FastSkillModificationLevelConfig,
  SkillModificationLevel,
  SlowSkillModificationLevelConfig,
} from "optolith-database-schema/types/SkillModificationLevel"

/**
 * The speed of an activatable skill.
 */
export enum Speed {
  Fast,
  Slow,
}

/**
 * Returns a common value for a skill modification level depending on the speed.
 */
export const getModifiableBySpeed = <T>(
  fast: (config: FastSkillModificationLevelConfig) => T,
  slow: (config: SlowSkillModificationLevelConfig) => T,
  speed: Speed,
  level: SkillModificationLevel
): T => {
  switch (speed) {
    case Speed.Fast:
      return fast(level.fast)
    case Speed.Slow:
      return slow(level.slow)
    default:
      return assertExhaustive(speed)
  }
}
