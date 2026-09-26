import type { AnyNonNullish } from "@elyukai/utils/nullable"
import type { Reader } from "@elyukai/utils/reader"
import type { Errata, PublicationRefs } from "@optolith/database-schema/gen"

/**
 * A JSON representation of the rules text for a library entry that has not been
 * cleaned up.
 */
export type RawEntityDescription<Cols extends string = string, E = AnyNonNullish> =
  | RawTextEntityDescription<E>
  | RawTabularEntityDescription<Cols, E>
  | RawTabularEntityDescription<Cols, E>[]

/**
 * A JSON representation of the rules text for a library entry that has not been
 * cleaned up.
 */
export type RawTextEntityDescription<E> = {
  type?: "text"
  category?: {
    label: Reader<E, string>
    value: Reader<E, string>
  }
  title: string
  subtitle?: string
  badge?: RawEntityDescriptionBadge
  className: string
  body: (RawEntityDescriptionSection | undefined)[]
  errata?: Errata
  references?: PublicationRefs
}

/**
 * A JSON representation of the table for a library entry that has not been
 * cleaned up.
 */
export type RawTabularEntityDescription<Cols extends string, E> = {
  type: "tabular"
  category?: {
    label: Reader<E, string>
    value: Reader<E, string>
  }
  title: string
  labels: { [K in Cols]: Reader<E, string> }
  values: { [K in Cols]: Reader<E, string> }
  additionalInformation?: (
    { label: Reader<E, string>; id: string; value: Reader<E, string | undefined> } | undefined
  )[]
  errata?: Errata
  references?: PublicationRefs
}

/**
 * A badge that can be displayed next to the title of a library entry.
 */
export type RawEntityDescriptionBadge = {
  type: "level" | "armedCombat" | "unarmedCombat"
  value: string
}

/**
 * A labeled or unlabeled section of a library entry text.
 */
export type RawEntityDescriptionSection =
  | RawEntityDescriptionSectionContent<RawDefinitionListEntityDescriptionSection>
  | RawLabeledEntityDescriptionSection

/**
 * A slice of the content of a library entry text.
 */
export type RawEntityDescriptionSectionContent<DL> =
  RawPlainEntityDescriptionSection | DL | RawTableEntityDescriptionSection

/**
 * A labeled section of a library entry text.
 */
export type RawLabeledEntityDescriptionSection = {
  type: "labeled"
  label: string
  value: RawEntityDescriptionSectionContent<RawDefinitionListEntityDescriptionSection>
}

/**
 * A plain text, possibly containing Markdown syntax.
 */
export type RawPlainEntityDescriptionSection = {
  type: "plain"
  text: string
}

/**
 * A list of labeled values, such as prerequisites or quality levels.
 */
export type RawDefinitionListEntityDescriptionSection = {
  type: "definitionList"
  items: (RawDefinitionListEntityDescriptionSectionItem | undefined)[]
}

/**
 * A list of labeled values, such as prerequisites or quality levels, nested within another definition list.
 */
export type RawNestedDefinitionListEntityDescriptionSection = {
  type: "definitionList"

  /**
   * How to render this definition list.
   *
   * - `"hidden"`: The definition list does not look like it is nested, it just looks like it belongs to its parent definition list.
   * - `"nested"`: The definition list is visually nested inside its parent definition list, usually indented and with italic labels instead of bold ones.
   */
  style: "hidden" | "nested"
  items: (RawDefinitionListEntityDescriptionSectionItem | undefined)[]
}

/**
 * A single labeled value in a definition list.
 */
export type RawDefinitionListEntityDescriptionSectionItem = {
  label: string
  value:
    | string
    | (
        | RawEntityDescriptionSectionContent<RawNestedDefinitionListEntityDescriptionSection>
        | undefined
      )[]
}

/**
 * A table with a header, rows, and an optional footer.
 */
export type RawTableEntityDescriptionSection = {
  type: "table"
  header: string[]
  rows: string[][]
  footer?: string[]
}
