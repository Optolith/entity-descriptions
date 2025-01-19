import { LocaleEnvironment } from "../../src/helpers/locale.js"
import { translateMapMock, translateMock } from "./translate.js"

const collator = new Intl.Collator("en-US")

const conjunctionListFormat = new Intl.ListFormat("en-US", {
  type: "conjunction",
})

const disjunctionListFormat = new Intl.ListFormat("en-US", {
  type: "disjunction",
})

/**
 * A mocked locale environment.
 */
export const defaultLocaleEnvironment: LocaleEnvironment = {
  id: "en-US",
  translate: translateMock,
  translateMap: translateMapMock,
  compare: (x, y) => collator.compare(x, y),
  joinConjunctionList: list => conjunctionListFormat.format(list),
  joinDisjunctionList: list => disjunctionListFormat.format(list),
}
