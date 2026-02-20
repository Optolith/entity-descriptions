import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type {
  DerivedCharacteristicBase,
  DerivedCharacteristicRaceBaseValue,
} from "optolith-database-schema/gen"
import { createEntityDescriptionCreator } from "../creator.js"
import type { GetInstanceById } from "../helpers/getTypes.js"
import type { Translate, TranslateMap } from "../helpers/translate.js"
import type { IdMap } from "../index.js"
import { renderMathOperation } from "./partial/mathOperation.js"
import { MISSING_VALUE } from "./partial/unknown.js"

const getAttribute = (
  getInstanceById: GetInstanceById<"Attribute">,
  translateMap: TranslateMap,
  attributeId: string,
  style: "full" | "compact" = "full",
): string => {
  const attribute = getInstanceById("Attribute", attributeId)

  if (attribute === undefined) {
    return MISSING_VALUE
  }

  switch (style) {
    case "full":
      return translateMap(attribute.translations)?.name ?? MISSING_VALUE
    case "compact":
      return translateMap(attribute.translations)?.abbreviation ?? MISSING_VALUE
    default:
      return assertExhaustive(style)
  }
}

const getRaceBaseValue = (
  translate: Translate,
  translateMap: TranslateMap,
  getInstanceById: GetInstanceById<"DerivedCharacteristic">,
  idMap: IdMap,
  raceBaseValue: DerivedCharacteristicRaceBaseValue,
  style: "full" | "compact" = "full",
): string => {
  const instance = getInstanceById(
    "DerivedCharacteristic",
    idMap.DerivedCharacteristic[raceBaseValue.kind],
  )

  const translation = translateMap(instance?.translations)

  if (translation === undefined) {
    return MISSING_VALUE
  }

  switch (style) {
    case "full":
      return translate("Base {$name} from Race", translation)
    case "compact":
      return translate("Race Base {$abbreviation}", translation)
    default:
      return assertExhaustive(style)
  }
}

const renderBaseCalculation = (
  getInstanceById: GetInstanceById<"Attribute" | "DerivedCharacteristic">,
  translate: Translate,
  translateMap: TranslateMap,
  idMap: IdMap,
  calculation: DerivedCharacteristicBase,
  style: "full" | "compact" = "full",
): string =>
  renderMathOperation(calculation, value => {
    switch (value.kind) {
      case "Constant":
        return value.Constant.toString(10)
      case "Attribute":
        return getAttribute(
          getInstanceById,
          translateMap,
          value.Attribute,
          style,
        )
      case "RaceBaseValue":
        return getRaceBaseValue(
          translate,
          translateMap,
          getInstanceById,
          idMap,
          value.RaceBaseValue,
          style,
        )
      case "PrimaryAttribute":
        switch (style) {
          case "full":
            switch (value.PrimaryAttribute.kind) {
              case "Magical":
                return translate(
                  "Primary attribute for the magic user’s Tradition",
                )
              case "Blessed":
                return translate(
                  "Primary attribute for the Blessed One’s Tradition",
                )
              default:
                return assertExhaustive(value.PrimaryAttribute)
            }
          case "compact":
            return translate("Primary Attribute")
          default:
            return assertExhaustive(style)
        }
      default:
        return assertExhaustive(value)
    }
  })

/**
 * Get a JSON representation of the rules text for a derived characteristic.
 */
export const getDerivedCharacteristicEntityDescription =
  createEntityDescriptionCreator<
    "DerivedCharacteristic",
    {
      getInstanceById: GetInstanceById<
        "Publication" | "Attribute" | "DerivedCharacteristic"
      >
      idMap: IdMap
    }
  >(
    (
      { getInstanceById, idMap },
      { translate, translateMap },
      { content: entry },
    ) => {
      const translation = translateMap(entry.translations)

      if (translation === undefined) {
        return undefined
      }

      return {
        title: `${translation.name} (${translation.abbreviation})`,
        className: "derived-characteristic",
        body: [
          translation.description === undefined
            ? undefined
            : {
                value: translation.description,
              },
          {
            label: translate("Base Value"),
            value: renderBaseCalculation(
              getInstanceById,
              translate,
              translateMap,
              idMap,
              entry.calculation.base,
            ),
          },
        ],
      }
    },
  )
