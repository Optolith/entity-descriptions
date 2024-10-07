import { range } from "@optolith/helpers/array"
import {
  Page,
  PageRange as RawPageRange,
  SimpleOccurrence,
} from "optolith-database-schema/types/source/_PublicationRef"
import { Translate } from "../helpers/translate.js"
import {
  comparePage,
  equalsPage,
  numberToPage,
  printPage,
  succ,
} from "./page.js"

/**
 * A range of pages, including the first and last page, if the range includes
 * more than on page.
 */
export type PageRange = {
  firstPage: Page
  lastPage?: Page
}

/**
 * Converts a numeric range to a page object range.
 */
export const numberRangeToPageRange = (
  numberRange: SimpleOccurrence,
): PageRange =>
  numberRange.last_page === undefined
    ? { firstPage: numberToPage(numberRange.first_page) }
    : {
        firstPage: numberToPage(numberRange.first_page),
        lastPage: numberToPage(numberRange.last_page),
      }

/**
 * Converts a page object range from the database to a local page object range.
 */
export const fromRawPageRange = (pageRange: RawPageRange): PageRange =>
  pageRange.last_page === undefined
    ? { firstPage: pageRange.first_page }
    : {
        firstPage: pageRange.first_page,
        lastPage: pageRange.last_page,
      }

/**
 * Sorts and combines page ranges while removing duplicates.
 */
export const normalizePageRanges = (ranges: PageRange[]): PageRange[] =>
  ranges
    .flatMap(({ firstPage, lastPage = firstPage }): Page[] => {
      if (firstPage.tag === "Numbered" && lastPage.tag === "Numbered") {
        return range(firstPage.numbered, lastPage.numbered).map(numbered => ({
          tag: "Numbered",
          numbered,
        }))
      } else {
        return [firstPage, lastPage]
      }
    })
    .filter((page, i, pages) => pages.findIndex(p => equalsPage(page, p)) === i)
    .sort(comparePage)
    .reduce<PageRange[]>((acc, page): PageRange[] => {
      const lastRange = acc[acc.length - 1]

      if (lastRange === undefined) {
        return [{ firstPage: page }]
      }

      const { firstPage, lastPage = firstPage } = lastRange

      if (equalsPage(page, succ(lastPage))) {
        return [...acc.slice(0, -1), { firstPage, lastPage: page }]
      }

      return [...acc, { firstPage: page }]
    }, [])

/**
 * Returns a string representation of a page range.
 */
export const printPageRange = (translate: Translate, pageRange: PageRange) =>
  pageRange.lastPage === undefined
    ? printPage(translate, pageRange.firstPage)
    : `${printPage(translate, pageRange.firstPage)}–${printPage(
        translate,
        pageRange.lastPage,
      )}`

/**
 * Returns a string representation of a list of page ranges.
 */
export const printPageRanges = (
  translate: Translate,
  pageRanges: PageRange[],
) =>
  pageRanges.map(pageRange => printPageRange(translate, pageRange)).join(", ")
