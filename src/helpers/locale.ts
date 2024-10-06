import { Compare } from "@optolith/helpers/compare"
import { Translate, TranslateMap } from "./translate.js"

export type LocaleEnvironment = {
  id: string
  translate: Translate
  translateMap: TranslateMap
  compare: Compare<string>
}
