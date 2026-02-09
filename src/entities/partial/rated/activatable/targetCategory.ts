import { mapNullable } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type {
  AffectedTargetCategories,
  SpecificAffectedTargetCategoryIdentifier,
} from "optolith-database-schema/gen"
import { type GetInstanceById } from "../../../../helpers/getTypes.js"
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

const getSpellworksTranslation = (locale: LocaleEnvironment) =>
  locale.translate("Spellworks")

const getCantripsTranslation = (locale: LocaleEnvironment) =>
  locale.translate("Cantrips")

const getPredefinedTranslation = (
  getInstanceById: GetInstanceById<"TargetCategory">,
  locale: LocaleEnvironment,
  id: string,
) =>
  mapNullable(
    locale.translateMap(getInstanceById("TargetCategory", id)?.translations),
    translation => translation.name,
  ) ?? MISSING_VALUE

const getTargetCategoryTranslationByType = (
  getInstanceById: GetInstanceById<"TargetCategory">,
  locale: LocaleEnvironment,
  id: SpecificAffectedTargetCategoryIdentifier,
) => {
  switch (id.kind) {
    case "Self":
      return getSelfTranslation(locale)
    case "Zone":
      return getZoneTranslation(locale)
    case "LiturgicalChantsAndCeremonies":
      return getLiturgicalChantsAndCeremoniesTranslation(locale)
    case "Spellworks":
      return getSpellworksTranslation(locale)
    case "Cantrips":
      return getCantripsTranslation(locale)
    case "Predefined":
      return getPredefinedTranslation(getInstanceById, locale, id.Predefined)
    default:
      return assertExhaustive(id)
  }
}

/**
 * Get the text for the target category.
 */
export const getTargetCategoryTranslation = (
  getInstanceById: GetInstanceById<"TargetCategory">,
  locale: LocaleEnvironment,
  values: AffectedTargetCategories,
): EntityDescriptionSection => ({
  label: locale.translate("Target Category"),
  value:
    values.length === 0
      ? locale.translate("all")
      : values
          .map(({ id, translations }) =>
            appendInParensIfNotEmpty(
              locale.translateMap(translations)?.note,
              getTargetCategoryTranslationByType(getInstanceById, locale, id),
            ),
          )
          .join(", "),
})
