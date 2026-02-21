import { Reader } from "@elyukai/utils/reader"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type {
  SkillCheckPenalty as GeneralSkillCheckPenalty,
  MagicalRuneCombatTechniqueCheckPenalty,
  SkillCheck,
} from "optolith-database-schema/gen"
import { type IdMap } from "../../../index.js"
import {
  getInstanceByIdR,
  responsiveR,
  responsiveThenR,
  responsiveTranslateR,
  translateMapR,
  translateR,
  type StdReader,
} from "../reader.js"
import { MISSING_VALUE } from "../unknown.js"

/**
 * Renders a skill check.
 */
export const renderSkillCheck = (
  check: SkillCheck,
): StdReader<
  { label: string; value: string },
  "t" | "tm" | "ibi",
  "Attribute"
> =>
  Reader.asks(({ translate, translateMap, getInstanceById }) => ({
    label: translate("Check"),
    value: check
      .map(
        id =>
          translateMap(getInstanceById("Attribute", id)?.translations)
            ?.abbreviation ?? MISSING_VALUE,
      )
      .join("/"),
  }))

type SkillCheckPenalty =
  | GeneralSkillCheckPenalty
  | {
      kind: "CombatTechnique"
      CombatTechnique: MagicalRuneCombatTechniqueCheckPenalty
    }

const renderSkillCheckPenalty = (
  idMap: IdMap,
  penalty: SkillCheckPenalty,
): StdReader<string, "t" | "tm" | "rts" | "ibi", "DerivedCharacteristic"> => {
  const getDerivedCharacteristicTranslation = (id: string) =>
    getInstanceByIdR<"DerivedCharacteristic">()
      .map(getInstanceById => getInstanceById("DerivedCharacteristic", id))
      .thenW(dc =>
        dc === undefined
          ? Reader.of(undefined)
          : translateMapR(dc.translations).thenW(translation =>
              translation === undefined
                ? Reader.of(undefined)
                : responsiveR(
                    () => translation.name,
                    () => translation.abbreviation,
                  ),
            ),
      )
      .map(translation => translation ?? MISSING_VALUE)

  const getSpiritTranslation = () =>
    getDerivedCharacteristicTranslation(idMap.DerivedCharacteristic.Spirit)

  const getToughnessTranslation = () =>
    getDerivedCharacteristicTranslation(idMap.DerivedCharacteristic.Toughness)

  switch (penalty.kind) {
    case "Spirit":
      return getSpiritTranslation()
    case "HalfOfSpirit":
      return getSpiritTranslation().map(translation => `${translation}/2`)
    case "Toughness":
      return getToughnessTranslation()
    case "HigherOfSpiritAndToughness":
      return getSpiritTranslation().thenW(spirit =>
        getToughnessTranslation().thenW(toughness =>
          responsiveThenR(
            () =>
              translateR(
                "{$first} or {$second}, depending on which value is higher",
                {
                  first: spirit,
                  second: toughness,
                },
              ),
            () => Reader.of(`${spirit}/${toughness}`),
          ),
        ),
      )
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
  idMap: IdMap,
): StdReader<
  { label: string; value: string },
  "t" | "tm" | "rts" | "ibi",
  "Attribute" | "DerivedCharacteristic"
> =>
  checkPenalty === undefined
    ? renderSkillCheck(check)
    : renderSkillCheck(check).thenW(checkText =>
        renderSkillCheckPenalty(idMap, checkPenalty)
          .then(penaltyText =>
            responsiveTranslateR(
              " (modified by {$modifier})",
              " (−{$modifier})",
              { modifier: penaltyText },
            ),
          )
          .map(penaltyText => ({
            ...checkText,
            value: checkText.value + penaltyText,
          })),
      )
