import { on } from "@elyukai/utils/function"
import { compareNumber } from "@elyukai/utils/ordering"
import { Reader } from "@elyukai/utils/reader"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type {
  DerivedCharacteristicSkillCheckPenalty,
  SkillCheckPenalty as GeneralSkillCheckPenalty,
  MagicalRuneCombatTechniqueCheckPenalty,
  SkillCheck,
} from "@optolith/database-schema/gen"
import type { StdReader } from "../../../env.js"
import { getDerivedCharacteristicPositionAndTranslation } from "../derivedCharacteristics.js"
import { responsiveTranslateR, translateR } from "../reader.js"
import { MISSING_VALUE } from "../unknown.js"

/**
 * Renders a skill check.
 */
export const renderSkillCheck = (
  check: SkillCheck,
): StdReader<{ label: string; value: string }, "t" | "tm" | "ibi", "Attribute"> =>
  Reader.asks(({ translate, translateMap, getInstanceById }) => ({
    label: translate("Check"),
    value: check
      .map(
        id =>
          translateMap(getInstanceById("Attribute", id)?.translations)?.abbreviation ??
          MISSING_VALUE,
      )
      .join("/"),
  }))

type SkillCheckPenalty =
  | GeneralSkillCheckPenalty
  | {
      kind: "CombatTechnique"
      CombatTechnique: MagicalRuneCombatTechniqueCheckPenalty
    }

const renderDerivedCharacteristicSkillCheckPenalty = (
  resistance: DerivedCharacteristicSkillCheckPenalty,
) => {
  switch (resistance.kind) {
    case "Single":
      return getDerivedCharacteristicPositionAndTranslation(
        resistance.Single.derivedCharacteristic,
        "check",
      ).map(([, translation]) => (resistance.Single.halved ? `${translation}/2` : translation))

    case "Maximum":
      return Reader.traverse(resistance.Maximum.derivedCharacteristics, id =>
        getDerivedCharacteristicPositionAndTranslation(id, "check"),
      ).thenW(list =>
        translateR("{$values :list type=disjunction}, depending on which value is higher", {
          values: list.toSorted(on(p => p[0], compareNumber)).map(p => p[1]),
        }),
      )

    default:
      return assertExhaustive(resistance)
  }
}

const renderSkillCheckPenalty = (
  penalty: SkillCheckPenalty,
): StdReader<string, "t" | "tm" | "rts" | "ibi", "DerivedCharacteristic"> => {
  switch (penalty.kind) {
    case "DerivedCharacteristic":
      return renderDerivedCharacteristicSkillCheckPenalty(penalty.DerivedCharacteristic)
    case "SummoningDifficulty":
      return responsiveTranslateR("Invocation Difficulty", "ID")
    case "CreationDifficulty":
      return responsiveTranslateR("Creation Difficulty", "CD")
    case "Object":
      return translateR("Object")
    case "CombatTechnique":
      return responsiveTranslateR("Combat Technique", "CT")
    default:
      return assertExhaustive(penalty)
  }
}

/**
 * Renders a skill check with a possible penalty.
 */
export const renderSkillCheckWithPenalty = (
  check: SkillCheck,
  checkPenalty: SkillCheckPenalty | undefined,
): StdReader<
  { label: string; value: string },
  "t" | "tm" | "rts" | "ibi",
  "Attribute" | "DerivedCharacteristic"
> =>
  checkPenalty === undefined
    ? renderSkillCheck(check)
    : renderSkillCheck(check).thenW(checkText =>
        renderSkillCheckPenalty(checkPenalty)
          .then(penaltyText =>
            responsiveTranslateR(" (modified by {$modifier})", " (−{$modifier})", {
              modifier: penaltyText,
            }),
          )
          .map(penaltyText => ({
            ...checkText,
            value: checkText.value + penaltyText,
          })),
      )
