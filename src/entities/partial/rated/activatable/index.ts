import { assertExhaustive } from "@elyukai/utils/typeSafety"
import { diffWordsWithSpace } from "diff"
import type {
  FastOneTimePerformanceParameters,
  FastSustainedPerformanceParameters,
  OneTimePerformanceParameters,
  ResponsiveTextOptional,
  SlowOneTimePerformanceParameters,
  SlowSustainedPerformanceParameters,
} from "optolith-database-schema/gen"
import type { RawDefinitionListEntityDescriptionSectionItem } from "../../../../index.js"
import type { StdReader } from "../../reader.js"
import { renderFastCastingTime, renderSlowCastingTime } from "./castingTime.js"
import { renderOneTimeCost, renderSustainedCost } from "./cost.js"
import { renderOneTimeDuration, renderSustainedDuration } from "./duration.js"
import { renderRange } from "./range.js"
import { Speed } from "./speed.js"

type RenderedPerformanceParameters = {
  castingTime: string
  cost: string
  range: string
  duration: string
}

/**
 * Get the texts for all fast one-time performance parameters.
 */
export const renderFastOneTimePerformanceParameters = (
  value: FastOneTimePerformanceParameters,
): StdReader<
  RenderedPerformanceParameters,
  "t" | "tm" | "lj" | "eu" | "rts" | "nms" | "ibi",
  "SkillModificationLevel"
> =>
  renderFastCastingTime(value.casting_time)
    .thenW(castingTime =>
      renderOneTimeCost(value.cost).then(cost =>
        renderRange(value.range).then(range =>
          renderOneTimeDuration(value.duration).map(duration => ({
            castingTime,
            cost,
            range,
            duration,
          })),
        ),
      ),
    )
    .with(env => ({ ...env, speed: Speed.Fast }))

/**
 * Get the texts for all fast sustained performance parameters.
 */
export const renderFastSustainedPerformanceParameters = (
  value: FastSustainedPerformanceParameters,
): StdReader<
  RenderedPerformanceParameters,
  "t" | "tm" | "lj" | "eu" | "rts" | "nms" | "ibi",
  "SkillModificationLevel"
> =>
  renderFastCastingTime(value.casting_time)
    .thenW(castingTime =>
      renderSustainedCost(value.cost).then(cost =>
        renderRange(value.range).then(range =>
          renderSustainedDuration(value.duration).map(duration => ({
            castingTime,
            cost,
            range,
            duration,
          })),
        ),
      ),
    )
    .with(env => ({ ...env, speed: Speed.Fast }))

/**
 * Renders the performance parameters for a fast activatable skill.
 */
export const renderFastPerformanceParameters = (
  value:
    | { kind: "OneTime"; OneTime: FastOneTimePerformanceParameters }
    | { kind: "Sustained"; Sustained: FastSustainedPerformanceParameters },
): StdReader<
  RenderedPerformanceParameters,
  "t" | "tm" | "lj" | "eu" | "rts" | "nms" | "ibi",
  "SkillModificationLevel"
> => {
  switch (value.kind) {
    case "OneTime":
      return renderFastOneTimePerformanceParameters(value.OneTime)
    case "Sustained":
      return renderFastSustainedPerformanceParameters(value.Sustained)
    default:
      return assertExhaustive(value)
  }
}

/**
 * Get the texts for all slow one-time performance parameters.
 */
export const renderSlowOneTimePerformanceParameters = <CastingTime>(
  renderCastingTime: (
    value: CastingTime,
  ) => StdReader<string, "t" | "rts" | "nms" | "ibi", "SkillModificationLevel">,
  value: OneTimePerformanceParameters<CastingTime>,
): StdReader<
  RenderedPerformanceParameters,
  "t" | "tm" | "lj" | "eu" | "rts" | "nms" | "ibi",
  "SkillModificationLevel"
> =>
  renderCastingTime(value.casting_time)
    .thenW(castingTime =>
      renderOneTimeCost(value.cost).then(cost =>
        renderRange(value.range).then(range =>
          renderOneTimeDuration(value.duration).map(duration => ({
            castingTime,
            cost,
            range,
            duration,
          })),
        ),
      ),
    )
    .with(env => ({ ...env, speed: Speed.Slow }))

/**
 * Get the texts for all slow sustained performance parameters.
 */
export const renderSlowSustainedPerformanceParameters = (
  value: SlowSustainedPerformanceParameters,
): StdReader<
  RenderedPerformanceParameters,
  "t" | "tm" | "lj" | "eu" | "rts" | "nms" | "ibi",
  "SkillModificationLevel"
> =>
  renderSlowCastingTime(value.casting_time)
    .thenW(castingTime =>
      renderSustainedCost(value.cost).then(cost =>
        renderRange(value.range).then(range =>
          renderSustainedDuration(value.duration).map(duration => ({
            castingTime,
            cost,
            range,
            duration,
          })),
        ),
      ),
    )
    .with(env => ({ ...env, speed: Speed.Slow }))

/**
 * Renders the performance parameters for a slow activatable skill.
 */
export const renderSlowPerformanceParameters = (
  value:
    | { kind: "OneTime"; OneTime: SlowOneTimePerformanceParameters }
    | { kind: "Sustained"; Sustained: SlowSustainedPerformanceParameters },
): StdReader<
  RenderedPerformanceParameters,
  "t" | "tm" | "lj" | "eu" | "rts" | "nms" | "ibi",
  "SkillModificationLevel"
> => {
  switch (value.kind) {
    case "OneTime":
      return renderSlowOneTimePerformanceParameters(renderSlowCastingTime, value.OneTime)
    case "Sustained":
      return renderSlowSustainedPerformanceParameters(value.Sustained)
    default:
      return assertExhaustive(value)
  }
}

/**
 * Diff the generated text with the static translation and combine them into a single text, highlighting the differences.
 */
export const combineGeneratedTextWithStaticTranslation = (
  label: string,
  generatedText: string | undefined,
  staticText: ResponsiveTextOptional | string | undefined,
): RawDefinitionListEntityDescriptionSectionItem | undefined => {
  if (generatedText === undefined) {
    return undefined
  }

  const normalizedStaticText = typeof staticText === "string" ? staticText : staticText?.full
  const diff =
    normalizedStaticText === undefined
      ? undefined
      : diffWordsWithSpace(normalizedStaticText, generatedText)

  return {
    label,
    value:
      diff === undefined
        ? generatedText
        : diff
            .map(part =>
              part.added
                ? `<ins>${part.value}</ins>`
                : part.removed
                  ? `<del>${part.value}</del>`
                  : part.value,
            )
            .join(""),
  }
}
