import type { PublicationRefs } from "@optolith/database-schema/gen"
import { isNotNullish } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type { GetInstanceById } from "../helpers/getTypes.js"
import type { LocaleEnvironment } from "../helpers/locale.js"
import { fromRawPageRange, normalizePageRanges, printPageRanges } from "./pageRange.js"
import { isPublicationIncluded, type PublicationOptions } from "./publicationOptions.js"

/**
 * Returns the translation of the references.
 */
export const getReferencesTranslation = (
  getInstanceById: GetInstanceById<"Publication">,
  publicationOptions: PublicationOptions,
  locale: LocaleEnvironment,
  references: PublicationRefs,
) =>
  references
    .map(ref => {
      const publication = getInstanceById("Publication", ref.id)
      const publicationTranslations = locale.translateMap(publication?.translations)
      const occurrences = locale.translateMap(ref.occurrences)

      if (
        publication === undefined ||
        publicationTranslations === undefined ||
        occurrences === undefined ||
        (publicationOptions.onlyShowReferencesToIncludedPublications &&
          !isPublicationIncluded(publicationOptions, ref.id, publication))
      ) {
        return undefined
      }

      const initialPageRanges = normalizePageRanges(occurrences.initial.pages.map(fromRawPageRange))

      const initial =
        occurrences.initial.printing === undefined
          ? printPageRanges(locale.translate, initialPageRanges)
          : `${printPageRanges(locale.translate, initialPageRanges)} (${locale.translate(
              ".input {$printing :number} {{since the {$printing}. printing}}",
              { printing: occurrences.initial.printing },
            )})`

      const revisions =
        occurrences.revisions?.map(rev => {
          switch (rev.kind) {
            case "Since": {
              const pageRanges = normalizePageRanges(rev.Since.pages.map(fromRawPageRange))
              return `${printPageRanges(locale.translate, pageRanges)} (${locale.translate(
                ".input {$printing :number} {{since the {$printing}. printing}}",
                { printing: rev.Since.printing },
              )})`
            }
            case "Deprecated": {
              return locale.translate(
                ".input {$printing :number} {{removed in {$printing}. printing}}",
                { printing: rev.Deprecated.printing },
              )
            }
            default:
              return assertExhaustive(rev)
          }
        }) ?? []

      const allPageRanges = [initial, ...revisions].join("; ")

      return `${publicationTranslations.name} ${allPageRanges}`
    })
    .filter(isNotNullish)
    .join("; ")
