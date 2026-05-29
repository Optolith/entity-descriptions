import type {
  AttributeTranslation,
  DerivedCharacteristicBase,
  DerivedCharacteristicTranslation,
} from "@optolith/database-schema/gen"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import { createEntityDescriptionCreator } from "../creator.js"
import type { GetInstanceById } from "../helpers/getTypes.js"
import type { Translate, TranslateMap } from "../helpers/translate.js"
import { attributedCustomName } from "./partial/markdown.js"
import { renderMathOperation } from "./partial/mathOperation.js"
import { MISSING_VALUE } from "./partial/unknown.js"

const renderAttributeNameForStyle = (
  style: "full" | "compact",
  translation: AttributeTranslation,
): string => {
  switch (style) {
    case "full":
      return translation.name
    case "compact":
      return translation.abbreviation
    default:
      return assertExhaustive(style)
  }
}

const getAttribute = (
  getInstanceById: GetInstanceById<"Attribute">,
  translateMap: TranslateMap,
  attributeId: string,
  style: "full" | "compact" = "full",
): string =>
  attributedCustomName(
    translateMap,
    getInstanceById,
    "derived-characteristic-calculation",
    translation => renderAttributeNameForStyle(style, translation),
    "Attribute",
    attributeId,
  ) ?? MISSING_VALUE

const getRaceBaseValue = (
  translate: Translate,
  translation: DerivedCharacteristicTranslation,
  style: "full" | "compact" = "full",
): string => {
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
  getInstanceById: GetInstanceById<"Attribute">,
  translate: Translate,
  translateMap: TranslateMap,
  translation: DerivedCharacteristicTranslation,
  calculation: DerivedCharacteristicBase,
  style: "full" | "compact" = "full",
): string =>
  renderMathOperation(calculation, value => {
    switch (value.kind) {
      case "Constant":
        return value.Constant.toFixed()
      case "Attribute":
        return getAttribute(getInstanceById, translateMap, value.Attribute, style)
      case "RaceBaseValue":
        return getRaceBaseValue(translate, translation, style)
      case "PrimaryAttribute":
        switch (style) {
          case "full":
            switch (value.PrimaryAttribute.kind) {
              case "Magical":
                return translate("Primary attribute for the magic user’s Tradition")
              case "Blessed":
                return translate("Primary attribute for the Blessed One’s Tradition")
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
export const getDerivedCharacteristicEntityDescription = createEntityDescriptionCreator<
  "DerivedCharacteristic",
  {
    getInstanceById: GetInstanceById<"Publication" | "Attribute" | "DerivedCharacteristic">
  }
>(({ getInstanceById }, { translate, translateMap }, { content: entry }) => {
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
            type: "plain",
            text: translation.description,
          },
      {
        type: "definitionList",
        items: [
          {
            label: translate("Base Value"),
            value: renderBaseCalculation(
              getInstanceById,
              translate,
              translateMap,
              translation,
              entry.calculation.base,
            ),
          },
        ],
      },
    ],
    references: entry.src,
  }
})
