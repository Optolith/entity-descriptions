import { Reader } from "@elyukai/utils/reader"
import type {
  ExpressionBasedRange,
  ModifiableRange,
  Range,
  RangeValue,
  SkillModificationLevel_ID,
} from "@optolith/database-schema/gen"
import { mapNullable } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import { Case } from "../../../../helpers/enums.js"
import {
  getInstanceByIdFnR,
  modifiableBySpeedOptionalR,
  modifiableBySpeedR,
  translateFnR,
  translateMapR,
  translateR,
  type StdReader,
} from "../../reader.js"
import { appendNoteIfNeeded, replaceTextIfNeeded } from "../../responsiveText.js"
import { formatLengthR } from "../../units/length.js"
import { MISSING_VALUE } from "../../unknown.js"
import { renderExpressionBasedParameterValue } from "./checkResultBased.js"
import { wrapIfMaximum } from "./isMinimumMaximum.js"
import { appendNonModifiableSuffix, ModifiableParameter } from "./nonModifiableSuffix.js"

const deriveModifiableRange = (
  modificationLevelId: SkillModificationLevel_ID,
): StdReader<
  { value: number; translation: string | undefined } | undefined,
  "s" | "tm" | "ibi",
  "SkillModificationLevel"
> =>
  getInstanceByIdFnR<"SkillModificationLevel">().thenW(
    getInstanceById =>
      mapNullable(
        getInstanceById("SkillModificationLevel", modificationLevelId),
        modificationLevel =>
          modifiableBySpeedR("range", modificationLevel).thenW(value =>
            translateMapR(modificationLevel.translations).thenW(translation =>
              translation === undefined
                ? Reader.of({ value, translation: undefined })
                : modifiableBySpeedOptionalR("range", translation).map(valueTranslation => ({
                    value,
                    translation: valueTranslation,
                  })),
            ),
          ),
      ) ?? Reader.of(undefined),
  )

const wrapIfRadius = (is_radius: boolean | undefined, text: string) =>
  translateFnR.map(translate => (is_radius === true ? `${text} ${translate("Radius")}` : text))

const renderModifiableRange = (value: ModifiableRange) =>
  deriveModifiableRange(value.initial_modification_level)
    .thenW(range =>
      range === undefined
        ? Reader.of(MISSING_VALUE)
        : range.translation !== undefined
          ? Reader.of(range.translation)
          : formatLengthR("Steps", range.value),
    )
    .then(text => wrapIfRadius(value.is_radius, text))
    .then(text => wrapIfMaximum(value.is_maximum, text))

const renderExpressionBasedRange = (value: ExpressionBasedRange) =>
  renderExpressionBasedParameterValue(value.value)
    .thenW(expressionValue => formatLengthR(value.unit, expressionValue))
    .then(text => wrapIfRadius(value.is_radius, text))
    .then(text => wrapIfMaximum(value.is_maximum, text))

/**
 * Returns the text for the non-modifiable range of an activatable skill.
 */
export const renderNonModifiableRange = (
  value:
    | {
        kind: "Sight"
      }
    | {
        kind: "Self"
      }
    | {
        kind: "Global"
      }
    | {
        kind: "Touch"
      }
    | {
        kind: "Fixed"
        Fixed: Omit<ExpressionBasedRange, "value"> & { value: number }
      }
    | {
        kind: "Expression"
        Expression: ExpressionBasedRange
      },
  shouldAppendNonModifiableSuffix: boolean,
): StdReader<string, "t" | "tm" | "rts" | "nms"> => {
  const appendNonModifiableSuffixIfNeeded = shouldAppendNonModifiableSuffix
    ? (text: string) => appendNonModifiableSuffix(ModifiableParameter.Range, text)
    : (text: string) => Reader.of(text)

  switch (value.kind) {
    case "Sight":
      return translateR("Sight")
    case "Self":
      return translateR("Self")
    case "Global":
      return translateR("Global")
    case "Touch":
      return translateR("Touch").thenW(appendNonModifiableSuffixIfNeeded)
    case "Fixed":
      return renderExpressionBasedRange({
        ...value.Fixed,
        value: Case("Value", Case("Constant", value.Fixed.value)),
      }).thenW(appendNonModifiableSuffixIfNeeded)
    case "Expression":
      return renderExpressionBasedRange(value.Expression).thenW(appendNonModifiableSuffixIfNeeded)
    default:
      return assertExhaustive(value)
  }
}

/**
 * Returns the text for the range of an activatable skill.
 */
export const renderRangeValue = (
  value: RangeValue,
  shouldAppendNonModifiableSuffix: boolean,
): StdReader<string, "t" | "tm" | "rts" | "s" | "nms" | "ibi", "SkillModificationLevel"> => {
  switch (value.kind) {
    case "Modifiable":
      return renderModifiableRange(value.Modifiable)
    case "Sight":
    case "Self":
    case "Global":
    case "Touch":
    case "Expression":
      return renderNonModifiableRange(value, shouldAppendNonModifiableSuffix)
    default:
      return assertExhaustive(value)
  }
}

/**
 * Returns the text for the range of an activatable skill.
 */
export const renderRange = (
  value: Range,
): StdReader<string, "t" | "tm" | "rts" | "s" | "nms" | "ibi", "SkillModificationLevel"> =>
  renderRangeValue(value.value, true)
    .then(text => replaceTextIfNeeded(value.translations, text))
    .then(text => appendNoteIfNeeded(value.translations, text))
