import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type {
  SkillCheck,
  SkillCheckPenalty,
} from "optolith-database-schema/gen"
import { type GetInstanceById } from "../../../helpers/getTypes.js"
import { Translate, TranslateMap } from "../../../helpers/translate.js"
import { EntityDescriptionSection, type IdMap } from "../../../index.js"
import { responsive, ResponsiveTextSize } from "../responsiveText.js"

/**
 * Returns the skill check as an inline library property.
 */
export const getTextForCheck = (
  deps: {
    translate: Translate
    translateMap: TranslateMap
    getInstanceById: GetInstanceById<"Attribute">
  },
  check: SkillCheck,
  checkPenalty?: {
    value: SkillCheckPenalty | undefined
    responsiveText: ResponsiveTextSize
    getInstanceById: GetInstanceById<"DerivedCharacteristic">
    idMap: IdMap
  },
): EntityDescriptionSection => ({
  label: deps.translate("Check"),
  value:
    check
      .map(
        id =>
          deps.translateMap(deps.getInstanceById("Attribute", id)?.translations)
            ?.abbreviation ?? "??",
      )
      .join("/") +
    (() => {
      if (checkPenalty?.value === undefined) {
        return ""
      }

      const { responsiveText } = checkPenalty

      const getDerivedCharacteristicTranslation = (id: string) =>
        deps.translateMap(
          checkPenalty.getInstanceById("DerivedCharacteristic", id)
            ?.translations,
        )

      const getSpiritTranslation = () =>
        getDerivedCharacteristicTranslation(
          checkPenalty.idMap.DerivedCharacteristic.Spirit,
        )

      const getToughnessTranslation = () =>
        getDerivedCharacteristicTranslation(
          checkPenalty.idMap.DerivedCharacteristic.Toughness,
        )

      const penalty = (() => {
        switch (checkPenalty.value.kind) {
          case "Spirit": {
            const translation = getSpiritTranslation()
            return translation === undefined
              ? ""
              : responsive(
                  responsiveText,
                  () => translation.name,
                  () => translation.abbreviation,
                )
          }

          case "HalfOfSpirit": {
            const translation = getSpiritTranslation()
            return translation === undefined
              ? ""
              : responsive(
                  responsiveText,
                  () => `${translation.name}/2`,
                  () => `${translation.abbreviation}/2`,
                )
          }

          case "Toughness": {
            const translation = getToughnessTranslation()
            return translation === undefined
              ? ""
              : responsive(
                  responsiveText,
                  () => `${translation.name}/2`,
                  () => `${translation.abbreviation}/2`,
                )
          }

          case "HigherOfSpiritAndToughness": {
            const spiritTranslation = getSpiritTranslation()
            const toughnessTranslation = getToughnessTranslation()
            return spiritTranslation === undefined ||
              toughnessTranslation === undefined
              ? ""
              : responsive(
                  responsiveText,
                  () =>
                    deps.translate(
                      "{$first} or {$second}, depending on which value is higher",
                      {
                        first: spiritTranslation.abbreviation,
                        second: toughnessTranslation.abbreviation,
                      },
                    ),
                  () =>
                    `${spiritTranslation.abbreviation}/${toughnessTranslation.abbreviation}`,
                )
          }

          case "SummoningDifficulty":
            return responsive(
              responsiveText,
              () => deps.translate("Invocation Difficulty"),
              () => deps.translate("ID"),
            )

          case "CreationDifficulty":
            return responsive(
              responsiveText,
              () => deps.translate("Creation Difficulty"),
              () => deps.translate("CD"),
            )

          case "Object":
            return deps.translate("Object")

          default:
            return assertExhaustive(checkPenalty.value)
        }
      })()

      return responsive(
        responsiveText,
        () =>
          deps.translate(" (modified by {$modifier})", { modifier: penalty }),
        () => deps.translate(" (−{$modifier})", { modifier: penalty }),
      )
    })(),
})
