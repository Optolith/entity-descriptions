import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type { LaboratoryLevel } from "optolith-database-schema/gen"
import type { Translate } from "../../helpers/translate.js"

/**
 * Renders a laboratory level into a localized string.
 */
export const renderLaboratoryLevel = (
  translate: Translate,
  level: LaboratoryLevel,
) => {
  switch (level.kind) {
    case "ArchaicLaboratory":
      return translate("Archaic laboratory")
    case "WitchKitchen":
      return translate("Witch kitchen")
    case "AlchemistsLaboratory":
      return translate("Alchemist’s laboratory")
    default:
      return assertExhaustive(level)
  }
}
