import { isNotNullish } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import { PublicationRefs } from "optolith-database-schema/types/source/_PublicationRef"
import { GetById } from "../helpers/getTypes.js"
import { LocaleEnvironment } from "../helpers/locale.js"
import {
  isSimpleOccurrence,
  isSimpleOccurrences,
  isVersionedOccurrence,
} from "./occurrence.js"
import {
  fromRawPageRange,
  normalizePageRanges,
  numberRangeToPageRange,
  printPageRange,
  printPageRanges,
} from "./pageRange.js"

export const getReferencesTranslation = (
  getPublicationById: GetById.Static.Publication,
  locale: LocaleEnvironment,
  references: PublicationRefs
) =>
  references
    .map((ref) => {
      const publication = getPublicationById(ref.id.publication)
      const publicationTranslations = locale.translateMap(
        publication?.translations
      )
      const occurrences = locale.translateMap(ref.occurrences)

      if (
        publication === undefined ||
        publicationTranslations === undefined ||
        occurrences === undefined
      ) {
        return undefined
      }

      if (isSimpleOccurrence(occurrences)) {
        return `${publicationTranslations.name} ${printPageRange(
          locale.translate,
          numberRangeToPageRange(occurrences)
        )}`
      }

      if (isSimpleOccurrences(occurrences)) {
        const ranges = normalizePageRanges(
          occurrences.map(numberRangeToPageRange)
        )
        return `${publicationTranslations.name} ${printPageRanges(
          locale.translate,
          ranges
        )}`
      }

      if (isVersionedOccurrence(occurrences)) {
        const initialPageRanges = normalizePageRanges(
          occurrences.initial.pages.map(fromRawPageRange)
        )

        const initial =
          occurrences.initial.printing === undefined
            ? printPageRanges(locale.translate, initialPageRanges)
            : `${printPageRanges(
                locale.translate,
                initialPageRanges
              )} (${locale.translate(
                "since the {0}. printing",
                occurrences.initial.printing
              )})`

        const revisions =
          occurrences.revisions?.map((rev) => {
            switch (rev.tag) {
              case "Since": {
                const pageRanges = normalizePageRanges(
                  rev.since.pages.map(fromRawPageRange)
                )
                return `${printPageRanges(
                  locale.translate,
                  pageRanges
                )} (${locale.translate(
                  "since the {0}. printing",
                  rev.since.printing
                )})`
              }
              case "Deprecated": {
                return locale.translate(
                  "removed in {0}. printing",
                  rev.deprecated.printing
                )
              }
              default:
                return assertExhaustive(rev)
            }
          }) ?? []

        const allPageRanges = [initial, ...revisions].join("; ")

        return `${publicationTranslations.name} ${allPageRanges}`
      }

      return assertExhaustive(occurrences)
    })
    .filter(isNotNullish)
    .join("; ")
