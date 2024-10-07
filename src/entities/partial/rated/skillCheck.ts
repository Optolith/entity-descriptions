import { assertExhaustive } from "@optolith/helpers/typeSafety"
import {
  SkillCheck,
  SkillCheckPenalty,
} from "optolith-database-schema/types/_SkillCheck"
import { DerivedCharacteristic } from "optolith-database-schema/types/DerivedCharacteristic"
import { GetById } from "../../../helpers/getTypes.js"
import { Translate, TranslateMap } from "../../../helpers/translate.js"
import { EntityDescriptionSection } from "../../../index.js"
import { responsive, ResponsiveTextSize } from "../responsiveText.js"

/**
 * Returns the skill check as an inline library property.
 */
export const getTextForCheck = (
  deps: {
    translate: Translate
    translateMap: TranslateMap
    getAttributeById: GetById.Static.Attribute
  },
  check: SkillCheck,
  checkPenalty?: {
    value: SkillCheckPenalty | undefined
    responsiveText: ResponsiveTextSize
    getSpirit: () => DerivedCharacteristic | undefined
    getToughness: () => DerivedCharacteristic | undefined
  }
): EntityDescriptionSection => ({
  label: deps.translate("Check"),
  value:
    check
      .map(
        ({ id: { attribute: id } }) =>
          deps.translateMap(deps.getAttributeById(id)?.translations)
            ?.abbreviation ?? "??"
      )
      .join("/") +
    (() => {
      if (checkPenalty?.value === undefined) {
        return ""
      }

      const { responsiveText } = checkPenalty

      const getDerivedCharacteristicTranslation = (
        getDerivedCharacteristic: () => DerivedCharacteristic | undefined
      ) => deps.translateMap(getDerivedCharacteristic()?.translations)

      const getSpiritTranslation = () =>
        getDerivedCharacteristicTranslation(checkPenalty.getSpirit)

      const getToughnessTranslation = () =>
        getDerivedCharacteristicTranslation(checkPenalty.getToughness)

      const penalty = (() => {
        switch (checkPenalty.value) {
          case "Spirit": {
            const translation = getSpiritTranslation()
            return translation === undefined
              ? ""
              : responsive(
                  responsiveText,
                  () => translation.name,
                  () => translation.abbreviation
                )
          }

          case "HalfOfSpirit": {
            const translation = getSpiritTranslation()
            return translation === undefined
              ? ""
              : responsive(
                  responsiveText,
                  () => `${translation.name}/2`,
                  () => `${translation.abbreviation}/2`
                )
          }

          case "Toughness": {
            const translation = getToughnessTranslation()
            return translation === undefined
              ? ""
              : responsive(
                  responsiveText,
                  () => `${translation.name}/2`,
                  () => `${translation.abbreviation}/2`
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
                      "{0} or {1}, depending on which value is higher",
                      spiritTranslation.abbreviation,
                      toughnessTranslation.abbreviation
                    ),
                  () =>
                    `${spiritTranslation.abbreviation}/${toughnessTranslation.abbreviation}`
                )
          }

          case "SummoningDifficulty":
            return responsive(
              responsiveText,
              () => deps.translate("Invocation Difficulty"),
              () => deps.translate("ID")
            )

          case "CreationDifficulty":
            return responsive(
              responsiveText,
              () => deps.translate("Creation Difficulty"),
              () => deps.translate("CD")
            )

          default:
            return assertExhaustive(checkPenalty.value)
        }
      })()

      return responsive(
        responsiveText,
        () => deps.translate(" (modified by {0})", penalty),
        () => deps.translate(" (− {0})", penalty)
      )
    })(),
})
