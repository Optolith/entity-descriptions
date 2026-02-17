import type { AnimalType_ID } from "optolith-database-schema/gen"
import type { GetInstanceById } from "../../helpers/getTypes.js"
import type { LocaleCompare } from "../../helpers/locale.js"
import type { Translate, TranslateMap } from "../../helpers/translate.js"
import { MISSING_VALUE } from "./unknown.js"

/**
 * Renders animal types an entry applies to.
 */
export const renderAnimalTypesSection = (
  translate: Translate,
  translateMap: TranslateMap,
  localeCompare: LocaleCompare,
  getInstanceById: GetInstanceById<"AnimalType">,
  animalTypes: AnimalType_ID[],
) => ({
  label: translate("Animal Types"),
  value:
    animalTypes.length === 0
      ? translate("All")
      : animalTypes
          .map(
            animalTypeId =>
              translateMap(
                getInstanceById("AnimalType", animalTypeId)?.translations,
              )?.name ?? MISSING_VALUE,
          )
          .toSorted(localeCompare)
          .join(", "),
})
