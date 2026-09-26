import { Reader } from "@elyukai/utils/reader"
import type { PublicationRefs } from "@optolith/database-schema/gen"
import { isNotNullish } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import {
  getInstanceByIdR,
  sequence,
  translateMapR,
  translateR,
} from "../entities/partial/reader.js"
import type { StdReader } from "../env.js"
import { fromRawPageRange, normalizePageRanges, printPageRanges } from "./pageRange.js"
import { isPublicationIncluded, type PublicationOptions } from "./publicationOptions.js"

/**
 * Returns the translation of the references.
 */
export const getReferencesTranslation = (
  publicationOptions: PublicationOptions,
  references: PublicationRefs,
): StdReader<string, "t" | "tm" | "ibi", "Publication"> =>
  Reader.traverse(references, ref =>
    getInstanceByIdR("Publication", ref.id).thenW(publication =>
      translateMapR(publication?.translations).thenW(publicationTranslation =>
        translateMapR(ref.occurrences).thenW(occurrences => {
          if (
            publication === undefined ||
            publicationTranslation === undefined ||
            occurrences === undefined ||
            (publicationOptions.onlyShowReferencesToIncludedPublications &&
              !isPublicationIncluded(publicationOptions, ref.id, publication))
          ) {
            return Reader.of(undefined)
          }

          const initialPageRanges = normalizePageRanges(
            occurrences.initial.pages.map(fromRawPageRange),
          )

          const initial =
            occurrences.initial.printing === undefined
              ? printPageRanges(initialPageRanges)
              : sequence`${printPageRanges(initialPageRanges)} (${translateR(
                  ".input {$printing :number} {{since the {$printing}. printing}}",
                  { printing: occurrences.initial.printing },
                )})`

          const revisions =
            occurrences.revisions?.map(rev => {
              switch (rev.kind) {
                case "Since": {
                  const pageRanges = normalizePageRanges(rev.Since.pages.map(fromRawPageRange))
                  return sequence`${printPageRanges(pageRanges)} (${translateR(
                    ".input {$printing :number} {{since the {$printing}. printing}}",
                    { printing: rev.Since.printing },
                  )})`
                }
                case "Deprecated": {
                  return translateR(
                    ".input {$printing :number} {{removed in {$printing}. printing}}",
                    { printing: rev.Deprecated.printing },
                  )
                }
                default:
                  return assertExhaustive(rev)
              }
            }) ?? []

          return Reader.sequence([initial, ...revisions]).map(
            list => `${publicationTranslation.name} ${list.join("; ")}`,
          )
        }),
      ),
    ),
  ).map(list => list.filter(isNotNullish).join("; "))
