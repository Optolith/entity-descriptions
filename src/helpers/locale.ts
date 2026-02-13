import { Compare } from "@optolith/helpers/compare"
import { Translate, TranslateMap } from "./translate.js"

/**
 * The environment for a locale.
 */
export type LocaleEnvironment = {
  id: string
  translate: Translate
  translateMap: TranslateMap
  compare: LocaleCompare
  joinConjunctionList: (list: string[]) => string
  joinDisjunctionList: (list: string[]) => string
}

/**
 * A function that compares two strings according to the locale's sorting rules.
 */
export type LocaleCompare = Compare<string>
