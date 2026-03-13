import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type {
  FastSkillModificationLevelConfig,
  SkillModificationLevel,
  SlowSkillModificationLevelConfig,
} from "optolith-database-schema/gen"

/**
 * The speed of an activatable skill.
 */
export enum Speed {
  Fast,
  Slow,
}

type SpeedMap = {
  [Speed.Fast]: FastSkillModificationLevelConfig
  [Speed.Slow]: SlowSkillModificationLevelConfig
}

/**
 * Returns a common value for a skill modification level depending on the speed.
 */
export const getModifiableBySpeed = <S extends Speed, K extends keyof SpeedMap[S]>(
  speed: S,
  key: K,
  level: SkillModificationLevel,
): SpeedMap[S][K] => {
  switch (speed) {
    case Speed.Fast:
      return level.fast[key as keyof FastSkillModificationLevelConfig] as SpeedMap[S][K]
    case Speed.Slow:
      return level.slow[key as keyof SlowSkillModificationLevelConfig] as SpeedMap[S][K]
    default:
      return assertExhaustive(speed)
  }
}

/**
 * Returns a common value for a skill modification level depending on the speed.
 */
export const getMapModifiableBySpeed = <T>(
  fast: (config: FastSkillModificationLevelConfig) => T,
  slow: (config: SlowSkillModificationLevelConfig) => T,
  speed: Speed,
  level: SkillModificationLevel,
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
