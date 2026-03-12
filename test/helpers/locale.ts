import { assertExhaustive } from "@elyukai/utils/typeSafety"
import { LocaleEnvironment } from "../../src/helpers/locale.js"
import { formatDateMock, formatMock, translateMapMock, translateMock } from "./translate.js"

const localeId = "en-US"

const collator = new Intl.Collator(localeId)

const conjunctionListFormat = new Intl.ListFormat(localeId, {
  type: "conjunction",
})
const disjunctionListFormat = new Intl.ListFormat(localeId, {
  type: "disjunction",
})
const unitListFormat = new Intl.ListFormat(localeId, {
  type: "unit",
})

/**
 * A mocked locale environment.
 */
export const defaultLocaleEnvironment: LocaleEnvironment = {
  id: "en-US",
  format: formatMock,
  formatDate: formatDateMock,
  translate: translateMock,
  translateMap: translateMapMock,
  compare: (x, y) => collator.compare(x, y),
  measurementAdjustments: {
    milesMultiplier: 1,
    stepsMultiplier: 1,
    halffingersMultiplier: 1,
    stonesMultiplier: 1,
  },
  join: (list, style) => {
    switch (style) {
      case "conjunction":
        return conjunctionListFormat.format(list)
      case "disjunction":
        return disjunctionListFormat.format(list)
      case "unit":
        return unitListFormat.format(list)
      default:
        return assertExhaustive(style)
    }
  },
}
