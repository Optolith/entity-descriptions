import { mapNullable } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import { TargetCategory } from "optolith-database-schema/types/_ActivatableSkillTargetCategory"
import { GetById } from "../../../../helpers/getTypes.js"
import { Translate, TranslateMap } from "../../../../helpers/translate.js"
import { LibraryEntryContent } from "../../../../libraryEntry.js"
import { MISSING_VALUE } from "../../unknown.js"
import { appendInParens } from "./parensIf.js"

/**
 * Get the text for the target category.
 */
export const getTextForTargetCategory = (
  deps: {
    translate: Translate
    translateMap: TranslateMap
    getTargetCategoryById: GetById.Static.TargetCategory
  },
  values: TargetCategory
): LibraryEntryContent => ({
  label: deps.translate("Target Category"),
  value:
    values.length === 0
      ? deps.translate("all")
      : values
          .map(({ id, translations }) => {
            const mainName = (() => {
              switch (id.tag) {
                case "Self":
                  return deps.translate("Self")
                case "Zone":
                  return deps.translate("Zone")
                case "LiturgicalChantsAndCeremonies":
                  return deps.translate("Liturgical Chants and Ceremonies")
                case "Cantrips":
                  return deps.translate("Cantrips")
                case "Predefined": {
                  const numericId = id.predefined.id.target_category
                  const specificTargetCategory =
                    deps.getTargetCategoryById(numericId)
                  return (
                    mapNullable(
                      deps.translateMap(specificTargetCategory?.translations),
                      (translation) => translation.name
                    ) ?? MISSING_VALUE
                  )
                }
                default:
                  return assertExhaustive(id)
              }
            })()

            return appendInParens(
              mainName,
              deps.translateMap(translations)?.note
            )
          })
          .join(", "),
})
