import { Reader } from "@elyukai/utils/reader"
import type { StdReader } from "../../env.js"
import { attributedCustomNameFromInstanceR, getInstanceByIdFnR, responsiveR } from "./reader.js"
import { MISSING_VALUE } from "./unknown.js"

/**
 * Renders a derived characteristic into a localized string, including its given position.
 */
export const getDerivedCharacteristicPositionAndTranslation = (
  id: string,
  context: string,
): StdReader<[number, string], "tm" | "rts" | "ibi", "DerivedCharacteristic"> =>
  getInstanceByIdFnR<"DerivedCharacteristic">()
    .map(getInstanceById => getInstanceById("DerivedCharacteristic", id))
    .thenW(dc =>
      dc === undefined
        ? Reader.of([-1, MISSING_VALUE])
        : attributedCustomNameFromInstanceR(
            dc,
            context,
            translation =>
              responsiveR(
                () => translation.name,
                () => translation.abbreviation,
              ),
            "DerivedCharacteristic",
            id,
          ).map((translation): [number, string] => [dc.position, translation ?? MISSING_VALUE]),
    )
