import { ensureNonEmpty } from "@elyukai/utils/array/nonEmpty"
import { isNotNullish } from "@elyukai/utils/nullable"
import type {
  AlternativeName,
  Cause,
  Errata,
  PublicationRefs,
  Reduceable,
  Resistance,
} from "@optolith/database-schema/gen"
import { createEntityDescriptionCreator } from "../creator.js"
import type { GetInstanceById } from "../helpers/getTypes.js"
import type { LocaleMap, Translate, TranslateMap } from "../helpers/translate.js"
import type { IdMap } from "../index.js"
import { renderAnimalTypesSection } from "./partial/animalTypes.js"
import { renderAlternativeNames, renderChance, renderResistance } from "./partial/herbary.js"
import { parensIf } from "./partial/rated/activatable/parensIf.js"
import { MISSING_VALUE } from "./partial/unknown.js"

type BaseDisease = {
  level: number
  resistance: Resistance
  cause: Cause[]
  isChildhoodDisease?: boolean
  isMagicalDisease?: boolean
  src: PublicationRefs
  translations: LocaleMap<BaseDiseaseTranslation>
}

type BaseDiseaseTranslation = {
  name: string
  alternative_names?: AlternativeName[]
  progress: string
  incubation_time: string
  damage: Reduceable<string>
  duration: Reduceable<string>
  special?: string
  treatment: string
  cure: string
  errata?: Errata
}

const renderCauses = (translate: Translate, translateMap: TranslateMap, causes: Cause[]) =>
  causes
    .map(cause => {
      const causeTranslation = translateMap(cause.translations)

      if (causeTranslation === undefined) {
        return MISSING_VALUE
      }

      return (
        causeTranslation.name +
        parensIf(
          ensureNonEmpty(
            [renderChance(translate, translateMap, cause, true), causeTranslation.note].filter(
              isNotNullish,
            ),
          )?.join("; "),
        )
      )
    })
    .join(", ")

/**
 * Get a JSON representation of the rules text for an optional rule.
 */
export const getDiseaseEntityDescription = createEntityDescriptionCreator<
  "AnimalDisease" | "Disease",
  {
    getInstanceById: GetInstanceById<"Publication" | "AnimalType" | "DerivedCharacteristic">
    idMap: IdMap
  }
>(
  (
    { getInstanceById, idMap },
    { translate, translateMap, compare: localeCompare },
    { entity, content: entry },
  ) => {
    const baseEntry: BaseDisease = entry
    const translation = translateMap(baseEntry.translations)

    if (translation === undefined) {
      return undefined
    }

    return {
      title:
        translation.name +
        parensIf(
          ensureNonEmpty(
            [
              baseEntry.isChildhoodDisease === true ? translate("childhood disease") : undefined,
              baseEntry.isMagicalDisease === true ? translate("magical disease") : undefined,
            ].filter(isNotNullish),
          )?.join(", "),
        ),
      className: "disease",
      body: [
        {
          type: "definitionList",
          items: [
            renderAlternativeNames(translate, translation.alternative_names),
            { label: translate("Level"), value: baseEntry.level.toFixed() },
            { label: translate("Progress"), value: translation.progress },
            {
              label: translate("Resistance"),
              value: renderResistance(
                translate,
                translateMap,
                getInstanceById,
                idMap,
                baseEntry.resistance,
              ),
            },
            {
              label: translate("Incubation Time"),
              value: translation.incubation_time,
            },
            {
              label: translate("Damage"),
              value:
                translation.damage.default +
                (translation.damage.reduced === undefined
                  ? ""
                  : ` / ${translation.damage.reduced}`),
            },
            {
              label: translate("Duration"),
              value:
                translation.duration.default +
                (translation.duration.reduced === undefined
                  ? ""
                  : ` / ${translation.duration.reduced}`),
            },
            {
              label: translate("Causes"),
              value: renderCauses(translate, translateMap, baseEntry.cause),
            },
            translation.special === undefined
              ? undefined
              : { label: translate("Special"), value: translation.special },
            { label: translate("Treatment"), value: translation.treatment },
            { label: translate("Antidote"), value: translation.cure },
            entity === "AnimalDisease"
              ? renderAnimalTypesSection(
                  translate,
                  translateMap,
                  localeCompare,
                  getInstanceById,
                  entry.animal_types,
                )
              : undefined,
            entity === "AnimalDisease"
              ? {
                  label: translate("Communicability to Intelligent Creatures"),
                  value:
                    entry.communicability_to_intelligent_creatures.length === 0
                      ? translate("No")
                      : `${translate("Yes")}; ${renderCauses(
                          translate,
                          translateMap,
                          entry.communicability_to_intelligent_creatures,
                        )}`,
                }
              : undefined,
          ],
        },
      ],
      errata: translation.errata,
      references: baseEntry.src,
    }
  },
)
