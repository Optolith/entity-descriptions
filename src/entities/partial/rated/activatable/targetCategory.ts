import { mapNullable } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import {
  TargetCategory,
  TargetCategoryIdentifier,
} from "optolith-database-schema/types/_ActivatableSkillTargetCategory"
import { TargetCategoryReference } from "optolith-database-schema/types/_SimpleReferences"
import { GetById } from "../../../../helpers/getTypes.js"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { EntityDescriptionSection } from "../../../../index.js"
import { MISSING_VALUE } from "../../unknown.js"
import { appendInParensIfNotEmpty } from "./parensIf.js"

const getSelfTranslation = (locale: LocaleEnvironment) =>
  locale.translate("Self")

const getZoneTranslation = (locale: LocaleEnvironment) =>
  locale.translate("Zone")

const getLiturgicalChantsAndCeremoniesTranslation = (
  locale: LocaleEnvironment,
) => locale.translate("Liturgical Chants and Ceremonies")

const getCantripsTranslation = (locale: LocaleEnvironment) =>
  locale.translate("Cantrips")

const getPredefinedTranslation = (
  getTargetCategoryById: GetById.Static.TargetCategory,
  locale: LocaleEnvironment,
  value: TargetCategoryReference,
) => {
  const numericId = value.id.target_category
  const specificTargetCategory = getTargetCategoryById(numericId)

  return (
    mapNullable(
      locale.translateMap(specificTargetCategory?.translations),
      translation => translation.name,
    ) ?? MISSING_VALUE
  )
}

const getTargetCategoryTranslationByType = (
  getTargetCategoryById: GetById.Static.TargetCategory,
  locale: LocaleEnvironment,
  id: TargetCategoryIdentifier,
) => {
  switch (id.tag) {
    case "Self":
      return getSelfTranslation(locale)
    case "Zone":
      return getZoneTranslation(locale)
    case "LiturgicalChantsAndCeremonies":
      return getLiturgicalChantsAndCeremoniesTranslation(locale)
    case "Cantrips":
      return getCantripsTranslation(locale)
    case "Predefined":
      return getPredefinedTranslation(
        getTargetCategoryById,
        locale,
        id.predefined,
      )
    default:
      return assertExhaustive(id)
  }
}

/**
 * Get the text for the target category.
 */
export const getTargetCategoryTranslation = (
  getTargetCategoryById: GetById.Static.TargetCategory,
  locale: LocaleEnvironment,
  values: TargetCategory,
): EntityDescriptionSection => ({
  label: locale.translate("Target Category"),
  value:
    values.length === 0
      ? locale.translate("all")
      : values
          .map(({ id, translations }) =>
            appendInParensIfNotEmpty(
              locale.translateMap(translations)?.note,
              getTargetCategoryTranslationByType(
                getTargetCategoryById,
                locale,
                id,
              ),
            ),
          )
          .join(", "),
})
