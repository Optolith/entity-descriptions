import { Reader } from "@elyukai/utils/reader"
import { mapNullable } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type {
  AffectedTargetCategories,
  SpecificAffectedTargetCategoryIdentifier,
  TargetCategory_ID,
} from "optolith-database-schema/gen"
import { type RawDefinitionListEntityDescriptionSectionItem } from "../../../../index.js"
import { getInstanceByIdFnR, translateMapR, translateR, type StdReader } from "../../reader.js"
import { MISSING_VALUE } from "../../unknown.js"
import { appendInParensIfNotEmpty } from "./parensIf.js"

const renderPredefined = (targetCategoryId: TargetCategory_ID) =>
  getInstanceByIdFnR<"TargetCategory">()
    .thenW(
      getInstanceById =>
        mapNullable(getInstanceById("TargetCategory", targetCategoryId), targetCategory =>
          translateMapR(targetCategory.translations).map(translation => translation?.name),
        ) ?? Reader.of(undefined),
    )
    .map(translation => translation ?? MISSING_VALUE)

const getTargetCategoryTranslationByType = (
  id: SpecificAffectedTargetCategoryIdentifier,
): StdReader<string, "t" | "tm" | "ibi", "TargetCategory"> => {
  switch (id.kind) {
    case "Self":
      return translateR("Self")
    case "Zone":
      return translateR("Zone")
    case "LiturgicalChantsAndCeremonies":
      return translateR("Liturgical Chants and Ceremonies")
    case "Spellworks":
      return translateR("Spellworks")
    case "Cantrips":
      return translateR("Cantrips")
    case "Predefined":
      return renderPredefined(id.Predefined)
    default:
      return assertExhaustive(id)
  }
}

/**
 * Get the text for the target category.
 */
export const renderTargetCategory = (
  values: AffectedTargetCategories,
): StdReader<RawDefinitionListEntityDescriptionSectionItem, "t" | "tm" | "ibi", "TargetCategory"> =>
  translateR("Target Category").thenW(label =>
    (values.length === 0
      ? translateR("all")
      : Reader.sequence(
          values.map(({ id, translations }) =>
            getTargetCategoryTranslationByType(id).then(text =>
              translateMapR(translations)
                .map(translation => translation?.note)
                .map(note => appendInParensIfNotEmpty(note, text)),
            ),
          ),
        ).map(texts => texts.join(", "))
    ).map(value => ({ label, value })),
  )
