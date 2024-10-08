import { PublicationRefs } from "optolith-database-schema/types/source/_PublicationRef"

/**
 * A JSON representation of the rules text for a library entry.
 */
export type EntityDescription = {
  title: string
  subtitle?: string
  className: string
  body: EntityDescriptionSection[]
  references?: string
}

/**
 * A JSON representation of the rules text for a library entry that has not been
 * cleaned up.
 */
export type RawEntityDescription = {
  title: string
  subtitle?: string
  className: string
  body: (EntityDescriptionSection | undefined)[]
  references?: PublicationRefs
}

/**
 * A slice of the content of a library entry text.
 */
export type EntityDescriptionSection = {
  label?: string
  value: string | number
  noIndent?: boolean
  className?: string
}
