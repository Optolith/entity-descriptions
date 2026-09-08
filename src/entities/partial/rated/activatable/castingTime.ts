import { Reader } from "@elyukai/utils/reader"
import type {
  CastingTime,
  CastingTimeDuringLovemaking,
  CastingTimeIncludingLovemaking,
  DurationUnitValue,
  FastCastingTime,
  FastSkillNonModifiableCastingTime,
  ModifiableCastingTime,
  SkillModificationLevel_ID,
  SlowCastingTime,
  SlowSkillNonModifiableCastingTime,
} from "@optolith/database-schema/gen"
import { isNotNullish, mapNullable } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import { Case } from "../../../../helpers/enums.js"
import { getInstanceByIdFnR, modifiableBySpeedR, type StdReader } from "../../reader.js"
import { appendNoteIfNeeded } from "../../responsiveText.js"
import { formatCombinedTimeSpanR, formatTimeSpanR } from "../../units/timeSpan.js"
import { MISSING_VALUE } from "../../unknown.js"
import { appendNonModifiableSuffix, ModifiableParameter } from "./nonModifiableSuffix.js"
import { Speed } from "./speed.js"

const deriveModifiableCastingTime = (
  modificationLevelId: SkillModificationLevel_ID,
): StdReader<DurationUnitValue | undefined, "s" | "ibi", "SkillModificationLevel"> =>
  getInstanceByIdFnR<"SkillModificationLevel">().thenW(
    getInstanceById =>
      mapNullable(
        getInstanceById("SkillModificationLevel", modificationLevelId),
        modificationLevel =>
          modifiableBySpeedR("casting_time", modificationLevel).map(castingTime =>
            typeof castingTime === "number"
              ? { value: castingTime, unit: Case("Actions") }
              : castingTime,
          ),
      ) ?? Reader.of(undefined),
  )

const renderModifiableCastingTime = (
  value: ModifiableCastingTime,
): StdReader<string, "t" | "tm" | "f" | "rts" | "s" | "ibi", "SkillModificationLevel"> =>
  deriveModifiableCastingTime(value.initial_modification_level)
    .thenW(castingTime =>
      castingTime === undefined ? Reader.of(MISSING_VALUE) : formatCombinedTimeSpanR(castingTime),
    )
    .thenW(text => appendNoteIfNeeded(value.translations, text))

const renderCastingTimeDuringLovemaking = (
  value: CastingTimeDuringLovemaking,
): StdReader<string, "t" | "tm" | "f" | "rts"> => formatCombinedTimeSpanR(value)

/**
 * Renders the text for a non-modifiable casting time of a fast activatable skill.
 */
export const renderFastSkillNonModifiableCastingTime = (
  value: FastSkillNonModifiableCastingTime,
): StdReader<string, "t" | "tm" | "f" | "rts"> =>
  formatTimeSpanR(Case("Actions"), value.actions).thenW(text =>
    appendNoteIfNeeded(value.translations, text),
  )

/**
 * Get the text for a non-modifiable casting time of a slow activatable skill.
 */
export const renderSlowSkillNonModifiableCastingTime = (
  value: SlowSkillNonModifiableCastingTime,
): StdReader<string, "t" | "tm" | "f" | "rts"> =>
  formatCombinedTimeSpanR(value).thenW(text => appendNoteIfNeeded(value.translations, text))

/**
 * Translate casting time.
 */
export const renderCastingTime = <NonModifiable extends object>(
  renderNonModifiableCastingTime: (
    value: NonModifiable,
  ) => StdReader<string, "t" | "tm" | "f" | "rts" | "s" | "nms">,
  value: CastingTime<NonModifiable>,
): StdReader<string, "t" | "tm" | "f" | "rts" | "s" | "nms" | "ibi", "SkillModificationLevel"> => {
  switch (value.kind) {
    case "Modifiable":
      return renderModifiableCastingTime(value.Modifiable)
    case "NonModifiable":
      return renderNonModifiableCastingTime(value.NonModifiable).then(base =>
        appendNonModifiableSuffix(ModifiableParameter.CastingTime, base),
      )
    default:
      return assertExhaustive(value)
  }
}

const renderCastingTimeIncludingLovemaking = <NonModifiable extends object>(
  renderNonModifiableCastingTime: (
    value: NonModifiable,
  ) => StdReader<string, "t" | "tm" | "f" | "rts" | "s" | "nms">,
  value: CastingTimeIncludingLovemaking<NonModifiable>,
) =>
  Reader.sequence([
    mapNullable(value.default, def => renderCastingTime(renderNonModifiableCastingTime, def)) ??
      Reader.of(undefined),
    mapNullable(value.during_lovemaking, renderCastingTimeDuringLovemaking) ?? Reader.of(undefined),
  ]).map(texts => texts.filter(isNotNullish).join(" / "))

/**
 * Get the text for the casting time of a fast activatable skill.
 */
export const renderFastCastingTime = (
  value: FastCastingTime,
): StdReader<string, "t" | "tm" | "f" | "rts" | "nms" | "ibi", "SkillModificationLevel"> =>
  renderCastingTimeIncludingLovemaking(renderFastSkillNonModifiableCastingTime, value).with(
    env => ({ ...env, speed: Speed.Fast }),
  )

/**
 * Get the text for the casting time of a slow activatable skill.
 */
export const renderSlowCastingTime = (
  value: SlowCastingTime,
): StdReader<string, "t" | "tm" | "f" | "rts" | "nms" | "ibi", "SkillModificationLevel"> =>
  renderCastingTimeIncludingLovemaking(renderSlowSkillNonModifiableCastingTime, value).with(
    env => ({ ...env, speed: Speed.Slow }),
  )
