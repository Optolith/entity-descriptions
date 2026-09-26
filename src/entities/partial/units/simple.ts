import { Reader } from "@elyukai/utils/reader"
import type { StdEnv } from "../../../env.js"
import { formatNumber, responsiveTranslateR, responsiveTranslateSplitR } from "../reader.js"

/**
 * Returns the text for numeric silverthaler cost.
 */
export const formatSilverthalers = (value: number) =>
  formatNumber(value).thenW(valueStr =>
    responsiveTranslateSplitR(
      ".input {$value :number} {{{$value} silverthalers}}",
      "{$value} S",
      {
        value,
      },
      {
        value: valueStr,
      },
    ),
  )

/**
 * Returns the text for silverthaler cost.
 */
export const formatArbitrarySilverthalers = (value: string | number) =>
  typeof value === "number"
    ? formatSilverthalers(value)
    : responsiveTranslateR("{$value} silverthalers", "{$value} S", {
        value,
      })

/**
 * Returns the text for weight in the weight unit of the locale.
 */
export const formatWeight = (value: number) =>
  responsiveTranslateR(
    ".input {$value :number} {{{$value} pounds}}",
    ".input {$value :number} {{{$value} lbs}}",
    {
      value,
    },
  )

/**
 * Adjusts a weight value according to the locale's measurement adjustments.
 */
export const adjustWeight = (value: number) =>
  Reader.asks((env: StdEnv<"ma">) => env.measurementAdjustments.stonesMultiplier * value)

/**
 * Returns the text for weight in the weight unit of the locale.
 */
export const formatAdjustedWeight = (value: number) => adjustWeight(value).thenW(formatWeight)

/**
 * Returns the text for arbitrary weight in the weight unit of the locale.
 */
export const formatArbitraryWeight = (value: string | number) =>
  typeof value === "number"
    ? formatWeight(value)
    : responsiveTranslateR("{$value} pounds", "{$value} lbs", {
        value,
      })

/**
 * Returns the text for adventure points.
 */
export const formatAdventurePoints = (value: number) =>
  formatNumber(value).thenW(valueStr =>
    responsiveTranslateSplitR(
      ".input {$value :number} {{{$value} Adventure Points}}",
      "{$value} AP",
      {
        value,
      },
      {
        value: valueStr,
      },
    ),
  )

/**
 * Returns the text for arbitrary adventure points.
 */
export const formatArbitraryAdventurePoints = (value: string | number) =>
  typeof value === "number"
    ? formatAdventurePoints(value)
    : responsiveTranslateR("{$value} Adventure Points", "{$value} AP", {
        value,
      })
