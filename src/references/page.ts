import { Compare } from "@optolith/helpers/compare"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import { Page } from "optolith-database-schema/types/source/_PublicationRef"
import { Translate } from "../helpers/translate.js"

/**
 * A comparison function for two pages.
 */
export const comparePage: Compare<Page> = (a, b) => {
  switch (a.tag) {
    case "InsideCoverFront":
      return b.tag === "InsideCoverFront" ? 0 : -1
    case "InsideCoverBack":
      return b.tag === "InsideCoverBack" ? 0 : 1
    case "Numbered":
      return b.tag === "Numbered"
        ? a.numbered - b.numbered
        : b.tag === "InsideCoverFront"
        ? 1
        : -1
    default:
      return assertExhaustive(a)
  }
}

/**
 * Checks if two pages are equal.
 */
export const equalsPage = (a: Page, b: Page): boolean => comparePage(a, b) === 0

/**
 * Returns the successor of a page.
 */
export const succ = (page: Page): Page => {
  switch (page.tag) {
    case "InsideCoverFront":
      return { tag: "Numbered", numbered: 1 }
    case "InsideCoverBack":
      return { tag: "InsideCoverFront", inside_cover_front: {} }
    case "Numbered":
      return { tag: "Numbered", numbered: page.numbered + 1 }
    default:
      return assertExhaustive(page)
  }
}

/**
 * Creates a page object for a page number.
 */
export const numberToPage = (number: number): Page => ({
  tag: "Numbered",
  numbered: number,
})

/**
 * Returns a string representation of a page.
 */
export const printPage = (translate: Translate, page: Page) => {
  switch (page.tag) {
    case "InsideCoverFront":
      return translate("Front Cover Inside")
    case "InsideCoverBack":
      return translate("Back Cover Inside")
    case "Numbered":
      return page.numbered.toString()
    default:
      return assertExhaustive(page)
  }
}
