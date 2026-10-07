import { ensureNonEmpty } from "@elyukai/utils/array/nonEmpty"
import { isNotNullish, type AnyNonNullish } from "@elyukai/utils/nullable"
import type { Reader } from "@elyukai/utils/reader"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type { EntityMap } from "@optolith/database-schema/gen"
import type {
  DefinitionListEntityDescriptionSection,
  EntityDescription,
  EntityDescriptionSection,
  EntityDescriptionSectionContent,
  NestedDefinitionListEntityDescriptionSection,
  TabularEntityDescription,
  TextEntityDescription,
} from "./entityDescription.js"
import type { StdEnv } from "./env.js"
import type { LocaleEnvironment } from "./helpers/locale.js"
import { unwrapNestedReaders, type WrapInNestedReaders } from "./nestedReaders.js"
import type {
  RawDefinitionListEntityDescriptionSection,
  RawEntityDescription,
  RawEntityDescriptionSection,
  RawEntityDescriptionSectionContent,
  RawNestedDefinitionListEntityDescriptionSection,
  RawTabularEntityDescription,
  RawTextEntityDescription,
} from "./rawEntityDescription.js"
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
    label: item.label,
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

const mapRawTabular = <Cols extends string>(
  raw: RawTabularEntityDescription<Cols>,
  env: StdEnv<"fd" | "t" | "tm" | "ibi", "Publication">,
  options: { publications: PublicationOptions },
): TabularEntityDescription<Cols> => ({
  ...raw,
  additionalInformation:
    raw.additionalInformation === undefined
      ? undefined
      : raw.additionalInformation
          .map(info => {
            if (info === undefined) {
              return undefined
            }
            const { label, id, value } = info
            if (value === undefined) {
              return undefined
            }
            return {
              label,
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

const mapRawText = (
  raw: RawTextEntityDescription,
  env: StdEnv<"fd" | "t" | "tm" | "ibi", "Publication">,
  options: { publications: PublicationOptions },
): TextEntityDescription => ({
  ...raw,
  body: raw.body.filter(isNotNullish).map(mapRawSection),
  errata: raw.errata?.map(({ date, description }) => ({
    date: env.formatDate(new Date(date)),
    description: description.trim(),
  })),
  references:
    raw.references === undefined
      ? undefined
      : getReferencesTranslation(options.publications, raw.references).run(env),
})

const mapRaw = <Cols extends string>(
  raw: RawTabularEntityDescription<Cols> | RawTextEntityDescription,
  env: StdEnv<"fd" | "t" | "tm" | "ibi", "Publication">,
  options: { publications: PublicationOptions },
) => {
  switch (raw.type) {
    case "tabular":
      return mapRawTabular(raw, env, options)
    case "text":
    case undefined:
      return mapRawText(raw, env, options)
    default:
      return assertExhaustive(raw)
  }
}

/**
 * Creates a function that creates the JSON representation of the rules text for
 * a library entry.
 */
export const createEntityDescriptionCreator =
  <ES extends keyof EntityMap, A = AnyNonNullish, Cols extends string = never>(
    fn: EntityDescriptionCreator<
      ES,
      A,
      WrapInNestedReaders<A, RawEntityDescription<Cols> | undefined>
    >,
  ): EntityDescriptionCreator<ES, A & StdEnv<"fd" | "t" | "tm" | "ibi", "Publication">> =>
  (databaseAccessors, locale, entry, options) => {
    const rawEntry = unwrapNestedReaders(
      fn(databaseAccessors, locale, entry, options),
      databaseAccessors,
    )

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
        .map(e => mapRaw(e, databaseAccessors, options))
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

    return mapRaw(rawEntry, databaseAccessors, options)
  }

/**
 * A function that creates the JSON representation of the rules text for a
 * library entry.
 */
export type EntityDescriptionCreator<
  ES extends keyof EntityMap = keyof EntityMap,
  A = AnyNonNullish,
  R = EntityDescription<string> | undefined,
> = (
  databaseAccessors: A,
  locale: LocaleEnvironment,
  entry: TaggedEntity<ES>,
  options: { publications: PublicationOptions },
) => R

/**
 * Bridge between Reader and plain string instances in a definition list item.
 */
export const combatDLItem = <T, E>(
  item: { label: Reader<E, string>; value: Reader<E, T> } | undefined,
  env: E,
) =>
  item === undefined
    ? undefined
    : {
        label: item.label.run(env),
        value: item.value.run(env),
      }
