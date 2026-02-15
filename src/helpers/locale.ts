import { Compare } from "@optolith/helpers/compare"
import type { LocaleMeasurementAdjustments } from "optolith-database-schema/gen"
import { Translate, TranslateMap } from "./translate.js"

/**
 * The environment for a locale.
 */
export type LocaleEnvironment = {
  id: string
  translate: Translate
  translateMap: TranslateMap
  compare: LocaleCompare
  join: (list: string[], type: "conjunction" | "disjunction" | "unit") => string
  measurementAdjustments: Required<LocaleMeasurementAdjustments>
}

/**
 * A function that compares two strings according to the locale's sorting rules.
 */
export type LocaleCompare = Compare<string>

/**
 * A function that joins a list of strings according to the locale's rules for the given type.
 */
export type LocaleJoin = (
  list: string[],
  type: "conjunction" | "disjunction" | "unit",
) => string
