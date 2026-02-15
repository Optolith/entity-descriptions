import type { Dice } from "optolith-database-schema/gen"
import type { Translate } from "../../helpers/translate.js"

/**
 * Renders a dice expression like "2D6" into a localized string.
 */
export const renderDice = (translate: Translate, dice: Dice) =>
  translate("{$count}D{$sides}", { count: dice.number, sides: dice.sides })
