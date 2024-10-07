import {
  Occurrence,
  SimpleOccurrence,
  SimpleOccurrences,
  VersionedOccurrence,
} from "optolith-database-schema/types/source/_PublicationRef"

export const isSimpleOccurrence = (
  occurrence: Occurrence
): occurrence is SimpleOccurrence => Object.hasOwn(occurrence, "first_page")

export const isSimpleOccurrences = (
  occurrence: Occurrence
): occurrence is SimpleOccurrences => Array.isArray(occurrence)

export const isVersionedOccurrence = (
  occurrence: Occurrence
): occurrence is VersionedOccurrence => Object.hasOwn(occurrence, "initial")
