import {
  Occurrence,
  SimpleOccurrence,
  SimpleOccurrences,
  VersionedOccurrence,
} from "optolith-database-schema/types/source/_PublicationRef"

/**
 * Checks if the occurrence is a simple occurrence.
 */
export const isSimpleOccurrence = (
  occurrence: Occurrence,
): occurrence is SimpleOccurrence => Object.hasOwn(occurrence, "first_page")

/**
 * Checks if the occurrence is simple occurrences.
 */
export const isSimpleOccurrences = (
  occurrence: Occurrence,
): occurrence is SimpleOccurrences => Array.isArray(occurrence)

/**
 * Checks if the occurrence is a versioned occurrence.
 */
export const isVersionedOccurrence = (
  occurrence: Occurrence,
): occurrence is VersionedOccurrence => Object.hasOwn(occurrence, "initial")
