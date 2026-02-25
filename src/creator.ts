import { isNotNullish } from "@elyukai/utils/nullable"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type { EntityMap } from "optolith-database-schema/gen"
import type { GetInstanceById } from "./helpers/getTypes.js"
import { LocaleEnvironment } from "./helpers/locale.js"
import {
  EntityDescription,
  RawEntityDescription,
  type DefinitionListEntityDescriptionSection,
  type EntityDescriptionSection,
  type EntityDescriptionSectionContent,
  type NestedDefinitionListEntityDescriptionSection,
  type RawDefinitionListEntityDescriptionSection,
  type RawEntityDescriptionSection,
  type RawEntityDescriptionSectionContent,
  type RawNestedDefinitionListEntityDescriptionSection,
} from "./index.js"
import { getReferencesTranslation } from "./references/index.js"

/**
 * A union type of entities with their names as a discriminant property.
 */
export type TaggedEntity<ES extends keyof EntityMap> = {
  [E in ES]: { entity: E; content: EntityMap[E]; id: string }
}[ES]

const mapRawSectionContent = <
  RDL extends { type: "definitionList" },
  DL extends { type: "definitionList" },
>(
  mapDefinitionList: (definitionList: RDL) => DL,
  section: RawEntityDescriptionSectionContent<RDL>,
): EntityDescriptionSectionContent<DL> => {
  switch (section.type) {
    case "plain":
    case "table":
      return section
    case "definitionList":
      return mapDefinitionList(section)
    default:
      return assertExhaustive(section)
  }
}

const mapNestedDefinitionList = (
  definitionListSection: RawNestedDefinitionListEntityDescriptionSection,
): NestedDefinitionListEntityDescriptionSection => ({
  ...definitionListSection,
  items: definitionListSection.items.filter(isNotNullish).map(item => ({
    ...item,
    value:
      typeof item.value === "string"
        ? item.value
        : item.value
            .filter(isNotNullish)
            .map(subsection => mapRawSectionContent(mapNestedDefinitionList, subsection)),
  })),
})

const mapDefinitionList = (
  section: RawDefinitionListEntityDescriptionSection,
): DefinitionListEntityDescriptionSection => ({
  ...section,
  items: section.items.filter(isNotNullish).map(item => ({
    ...item,
    value:
      typeof item.value === "string"
        ? item.value
        : item.value
            .filter(isNotNullish)
            .map(subsection => mapRawSectionContent(mapNestedDefinitionList, subsection)),
  })),
})

const mapRawSection = (section: RawEntityDescriptionSection): EntityDescriptionSection => {
  switch (section.type) {
    case "labeled":
      return {
        ...section,
        value: mapRawSectionContent(mapDefinitionList, section.value),
      }
    case "plain":
    case "table":
    case "definitionList":
      return mapRawSectionContent(mapDefinitionList, section)
    default:
      return assertExhaustive(section)
  }
}

/**
 * Creates a function that creates the JSON representation of the rules text for
 * a library entry.
 */
export const createEntityDescriptionCreator =
  <
    ES extends keyof EntityMap,
    A extends {
      getInstanceById: GetInstanceById<"Publication">
    } = {
      getInstanceById: GetInstanceById<"Publication">
    },
  >(
    fn: EntityDescriptionCreator<ES, A, RawEntityDescription>,
  ): EntityDescriptionCreator<ES, A> =>
  (databaseAccessors, locale, entry) => {
    const rawEntry = fn(databaseAccessors, locale, entry)

    if (rawEntry === undefined) {
      return undefined
    }

    return {
      ...rawEntry,
      body: rawEntry.body.filter(isNotNullish).map(mapRawSection),
      errata: rawEntry.errata?.map(({ date, description }) => ({
        date: date.toLocaleDateString(locale.id),
        description: description.trim(),
      })),
      references:
        rawEntry.references === undefined
          ? undefined
          : getReferencesTranslation(
              databaseAccessors.getInstanceById,
              locale,
              rawEntry.references,
            ),
    }
  }

/**
 * A function that creates the JSON representation of the rules text for a
 * library entry.
 */
export type EntityDescriptionCreator<
  ES extends keyof EntityMap = keyof EntityMap,
  A extends { getInstanceById: GetInstanceById<"Publication"> } = {
    getInstanceById: GetInstanceById<"Publication">
  },
  R = EntityDescription,
> = (databaseAccessors: A, locale: LocaleEnvironment, entry: TaggedEntity<ES>) => R | undefined
