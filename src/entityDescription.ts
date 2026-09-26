/**
 * A JSON representation of the rules text for a library entry.
 */
export type EntityDescription<Cols extends string> =
  TextEntityDescription | TabularEntityDescription<Cols> | TabularEntityDescription<Cols>[]

/**
 * A JSON representation of the rules text for a library entry.
 */
export type TextEntityDescription = {
  type?: "text"
  category?: {
    label: string
    value: string
  }
  title: string
  subtitle?: string
  badge?: EntityDescriptionBadge
  className: string
  body: EntityDescriptionSection[]
  errata?: { date: string; description: string }[]
  references?: string
}

/**
 * A JSON representation of the rules text for a library entry.
 */
export type TabularEntityDescription<Cols extends string> = {
  type: "tabular"
  category?: {
    label: string
    value: string
  }
  title: string
  labels: { [K in Cols]: string }
  values: { [K in Cols]: string }
  additionalInformation?: { label: string; id: string; value: string }[]
  errata?: { date: string; description: string }[]
  references?: string
}

/**
 * A badge that can be displayed next to the title of a library entry.
 */
export type EntityDescriptionBadge = {
  type: "level" | "armedCombat" | "unarmedCombat"
  value: string
}

/**
 * A labeled or unlabeled section of a library entry text.
 */
export type EntityDescriptionSection =
  | EntityDescriptionSectionContent<DefinitionListEntityDescriptionSection>
  | LabeledEntityDescriptionSection

/**
 * A slice of the content of a library entry text.
 */
export type EntityDescriptionSectionContent<DL> =
  PlainEntityDescriptionSection | DL | TableEntityDescriptionSection

/**
 * A labeled section of a library entry text.
 */
export type LabeledEntityDescriptionSection = {
  type: "labeled"
  label: string
  value: EntityDescriptionSectionContent<DefinitionListEntityDescriptionSection>
}

/**
 * A plain text, possibly containing Markdown syntax.
 */
export type PlainEntityDescriptionSection = {
  type: "plain"
  text: string
}

/**
 * A list of labeled values, such as prerequisites or quality levels.
 */
export type DefinitionListEntityDescriptionSection = {
  type: "definitionList"
  items: DefinitionListEntityDescriptionSectionItem[]
}

/**
 * A list of labeled values, such as prerequisites or quality levels, nested within another definition list.
 */
export type NestedDefinitionListEntityDescriptionSection = {
  type: "definitionList"

  /**
   * How to render this definition list.
   *
   * - `"hidden"`: The definition list does not look like it is nested, it just looks like it belongs to its parent definition list.
   * - `"nested"`: The definition list is visually nested inside its parent definition list, usually indented and with italic labels instead of bold ones.
   */
  style: "hidden" | "nested"

  items: DefinitionListEntityDescriptionSectionItem[]
}

/**
 * A single labeled value in a definition list.
 */
export type DefinitionListEntityDescriptionSectionItem = {
  label: string
  value: string | EntityDescriptionSectionContent<NestedDefinitionListEntityDescriptionSection>[]
}

/**
 * A table with a header, rows, and an optional footer.
 */
export type TableEntityDescriptionSection = {
  type: "table"
  header: string[]
  rows: string[][]
  footer?: string[]
}
