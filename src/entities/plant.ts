/*import { on } from "@elyukai/utils/function"
import { isNotNullish } from "@elyukai/utils/nullable"
import { compareNumber, reduceCompare } from "@elyukai/utils/ordering"
import { Reader } from "@elyukai/utils/reader"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type {
  ApplicableAmmunitionCategory,
  ApplicableArmorCategory,
  ApplicableItems,
  ApplicableMeleeCombatTechnique,
  ApplicableMeleeWeaponCategory,
  Armor_ID,
  ItemComponent_ID,
  ItemComponentCost,
  MathOperation,
  Weapon_ID,
} from "@optolith/database-schema/gen"
import { Case } from "tsondb/schema/gen"*/
import { createEntityDescriptionCreator } from "../creator.js"
import type { StdEnv, /*StdReader*/ } from "../env.js"
/*import { renderFixedItemCost } from "./equipment.js"
import { renderValueMap } from "./partial/map.js"
import { renderMathOperationR } from "./partial/mathOperation.js"
import { parensIfR } from "./partial/rated/activatable/parensIf.js"
import {
  attributedNameR,
  formatNumber,
  getChildInstancesForInstanceIdR,
  localeCompareR,
  localeJoinR,
  localeSortR,
  sequence,
  translateMapR,
  translateR,
} from "./partial/reader.js"
import { ResponsiveTextSize } from "./partial/responsiveText.js"
import { formatArbitrarySilverthalers, formatSilverthalers } from "./partial/units/simple.js"
import { formatTimeSpanR } from "./partial/units/timeSpan.js"
import { MISSING_VALUE, UNHANDLED_VALUE } from "./partial/unknown.js"*/

/**
 * Get a JSON representation of the rules text for equipment.
 */
export const getPlantEntityDescription = createEntityDescriptionCreator<
  "Plant",
  StdEnv<
    "f" | "fn" | "t" | "tm" | "lj" | "lc" | "acibp" | "ibi",
    | "HerbalAid"
    | "HerbalPreservation"
    | "Biome",
    never
  >
>((_env, locale, entry) => {
  const { translateMap } = locale

  const translation = translateMap(entry.content.translations)

  if (translation === undefined) {
    return undefined
  }

  return {
    title: translation.name,
    className: "plant",
    body: [
      {
        type: "definitionList",
        items: [
          {
            label: "Test",
            value: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
          },
        ],
      },
    ],
    references: entry.content.src,
  }
})