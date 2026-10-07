import { sign } from "@elyukai/utils/string/number"
import type { EnergyPrerequisite } from "@optolith/database-schema/gen"
import type { StdReader } from "../../../../env.js"
import { formatDerivedCharacteristicEnergyUnit } from "../../derivedCharacteristics.js"
import { attributedCustomNameR } from "../../reader.js"
import { MISSING_VALUE } from "../../unknown.js"
import { printDisplayOption } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a blessed tradition prerequisite.
 */
export const printEnergyPrerequisite = (
  prerequisite: EnergyPrerequisite,
): StdReader<PrerequisitePart | undefined, "f" | "t" | "tm" | "ibi", "DerivedCharacteristic"> =>
  prerequisite.display_option !== undefined
    ? printDisplayOption(prerequisite.display_option)
    : attributedCustomNameR(
        "prerequisite",
        t => formatDerivedCharacteristicEnergyUnit(prerequisite.value, t),
        "DerivedCharacteristic",
        prerequisite.id,
      )
        .map(name => name ?? MISSING_VALUE)
        .map((name): PrerequisitePart | undefined => ({
          value: `${sign(prerequisite.value)} ${name}`,
          sentenceType: undefined,
          isMeta: false,
        }))
