import type { Translate, Translations } from "../../../helpers/translate.js"
import { responsive, ResponsiveTextSize } from "../responsiveText.js"

type LengthUnit = "Steps" | "Miles"

const lengthUnitTranslationKeys = {
  Steps: [
    ".input {$value :number} {{{$value} yards}}",
    "{$value} yards",
    "{$value} yd",
  ],
  Miles: [
    ".input {$value :number} {{{$value} miles}}",
    "{$value} miles",
    "{$value} mi.",
  ],
} as const satisfies {
  [key in LengthUnit]: [
    fullNumber: keyof Translations,
    full: keyof Translations,
    compressed: keyof Translations,
  ]
}

/**
 * Returns the text for a length unit.
 */
export const formatLength = (
  translate: Translate,
  responsiveTextSize: ResponsiveTextSize,
  unit: LengthUnit,
  value: number | string,
) => {
  const [fullNumberKey, fullKey, compressedKey] =
    lengthUnitTranslationKeys[unit]

  return responsive(
    responsiveTextSize,
    () =>
      translate(typeof value === "number" ? fullNumberKey : fullKey, {
        value,
      }),
    () => translate(compressedKey, { value }),
  )
}
