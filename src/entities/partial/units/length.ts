import { UI } from "optolith-database-schema/types/UI"
import { LocaleEnvironment } from "../../../helpers/locale.js"
import { responsive, ResponsiveTextSize } from "../responsiveText.js"

type LengthUnit = "Steps" | "Miles"

const lengthUnitTranslationKeys: {
  [key in LengthUnit]: [full: keyof UI, compressed: keyof UI]
} = {
  Steps: ["{0} yards", "{0} yd"],
  Miles: ["{0} miles", "{0} mi."],
}

/**
 * Returns the text for a length unit.
 */
export const formatLength = (
  locale: LocaleEnvironment,
  responsiveTextSize: ResponsiveTextSize,
  unit: LengthUnit,
  value: number | string
) => {
  const [fullKey, compressedKey] = lengthUnitTranslationKeys[unit]

  return responsive(
    responsiveTextSize,
    () => locale.translate(fullKey, value),
    () => locale.translate(compressedKey, value)
  )
}
