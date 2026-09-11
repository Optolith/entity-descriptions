import type { Dice } from "@optolith/database-schema/gen"
import type { Translate } from "../../helpers/translate.js"
import { additionFormatter, subtractionFormatter } from "./mathOperation.js"
import { translateR } from "./reader.js"

/**
 * Renders a dice expression like "2D6" into a localized string.
 */
export const renderDice = (translate: Translate, dice: Dice) =>
  translate("{$count}D{$sides}", { count: dice.number, sides: dice.sides })

/**
 * Renders a dice expression like "2D6" into a localized string.
 */
export const renderDiceR = (dice: Dice) =>
  translateR("{$count}D{$sides}", { count: dice.number, sides: dice.sides })

/**
 * Renders a dice expression with an additional flat modifier, like "2D6+3" or "2D6-1".
 */
export const renderDiceAndFlat = (translate: Translate, dice: Dice, flat: number | undefined) =>
  flat === undefined || flat === 0
    ? renderDice(translate, dice)
    : flat > 0
      ? additionFormatter(renderDice(translate, dice), flat)
      : subtractionFormatter(renderDice(translate, dice), flat)
