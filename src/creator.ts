import { ensureNonEmpty } from "@elyukai/utils/array/nonEmpty"
import { isNotNullish, type AnyNonNullish } from "@elyukai/utils/nullable"
import type { Reader } from "@elyukai/utils/reader"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type { EntityMap } from "@optolith/database-schema/gen"
import type { StdEnv } from "./env.js"
import type { LocaleEnvironment } from "./helpers/locale.js"
import type {
  DefinitionListEntityDescriptionSection,
  EntityDescription,
  EntityDescriptionSection,
  EntityDescriptionSectionContent,
  NestedDefinitionListEntityDescriptionSection,
  RawDefinitionListEntityDescriptionSection,
  RawEntityDescription,
  RawEntityDescriptionSection,
  RawEntityDescriptionSectionContent,
  RawNestedDefinitionListEntityDescriptionSection,
  RawTabularEntityDescription,
  TabularEntityDescription,
} from "./index.js"
import { getReferencesTranslation } from "./references/index.js"
import {
  isEntryFromIncludedPublication,
  type PublicationOptions,
} from "./references/publicationOptions.js"

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

const mapRawTabular = <
  Cols extends string,
  E extends StdEnv<"fd" | "t" | "tm" | "ibi", "Publication">,
>(
  raw: RawTabularEntityDescription<Cols, E>,
  env: E,
  options: { publications: PublicationOptions },
): TabularEntityDescription<Cols> => ({
  ...raw,
  category:
    raw.category === undefined
      ? undefined
      : {
          label: raw.category.label.run(env),
          value: raw.category.value.run(env),
        },
  labels: Object.fromEntries(
    Object.entries<Reader<E, string>>(raw.labels).map(([col, label]) => [col, label.run(env)]),
  ) as { [K in Cols]: string },
  values: Object.fromEntries(
    Object.entries<Reader<E, string>>(raw.values).map(([col, value]) => [col, value.run(env)]),
  ) as { [K in Cols]: string },
  additionalInformation:
    raw.additionalInformation === undefined
      ? undefined
      : raw.additionalInformation
          .map(info => {
            if (info === undefined) {
              return undefined
            }
            const { label: labelR, id, value: valueR } = info
            const value = valueR.run(env)
            if (value === undefined) {
              return undefined
            }
            return {
              label: labelR.run(env),
              id,
              value,
            }
          })
          .filter(isNotNullish),
  errata: raw.errata?.map(({ date, description }) => ({
    date: env.formatDate(new Date(date)),
    description: description.trim(),
  })),
  references:
    raw.references === undefined
      ? undefined
      : getReferencesTranslation(options.publications, raw.references).run(env),
})

/**
 * Creates a function that creates the JSON representation of the rules text for
 * a library entry.
 */
export const createEntityDescriptionCreator =
  <ES extends keyof EntityMap, A = AnyNonNullish, Cols extends string = never>(
    fn: EntityDescriptionCreator<ES, A, RawEntityDescription<Cols, A>>,
  ): EntityDescriptionCreator<ES, A & StdEnv<"fd" | "t" | "tm" | "ibi", "Publication">> =>
  (databaseAccessors, locale, entry, options) => {
    const rawEntry = fn(databaseAccessors, locale, entry, options)

    if (Array.isArray(rawEntry)) {
      const results = rawEntry
        .filter(e =>
          isEntryFromIncludedPublication(
            { src: e.references },
            databaseAccessors.getInstanceById,
            locale.translateMap,
            options.publications,
          ),
        )
        .map(e => mapRawTabular(e, databaseAccessors, options))
      return ensureNonEmpty(results)
    }

    if (
      rawEntry === undefined ||
      !isEntryFromIncludedPublication(
        { src: rawEntry.references },
        databaseAccessors.getInstanceById,
        locale.translateMap,
        options.publications,
      )
    ) {
      return undefined
    }

    if (rawEntry.type === "tabular") {
      return mapRawTabular(rawEntry, databaseAccessors, options)
    }

    return {
      ...rawEntry,
      category:
        rawEntry.category === undefined
          ? undefined
          : {
              label: rawEntry.category.label.run(databaseAccessors),
              value: rawEntry.category.value.run(databaseAccessors),
            },
      body: rawEntry.body.filter(isNotNullish).map(mapRawSection),
      errata: rawEntry.errata?.map(({ date, description }) => ({
        date: locale.formatDate(new Date(date)),
        description: description.trim(),
      })),
      references:
        rawEntry.references === undefined
          ? undefined
          : getReferencesTranslation(options.publications, rawEntry.references).run({
              ...databaseAccessors,
              ...locale,
            }),
    }
  }

/**
 * A function that creates the JSON representation of the rules text for a
 * library entry.
 */
export type EntityDescriptionCreator<
  ES extends keyof EntityMap = keyof EntityMap,
  A = AnyNonNullish,
  R = EntityDescription<string>,
> = (
  databaseAccessors: A,
  locale: LocaleEnvironment,
  entry: TaggedEntity<ES>,
  options: { publications: PublicationOptions },
) => R | undefined
