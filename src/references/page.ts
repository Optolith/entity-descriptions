import type { Compare } from "@optolith/helpers/compare"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type { Page } from "optolith-database-schema/gen"
import type { Translate } from "../helpers/translate.js"

/**
 * A comparison function for two pages.
 */
export const comparePage: Compare<Page> = (a, b) => {
  switch (a.kind) {
    case "InsideCoverFront":
      return b.kind === "InsideCoverFront" ? 0 : -1
    case "InsideCoverBack":
      return b.kind === "InsideCoverBack" ? 0 : 1
    case "Numbered":
      return b.kind === "Numbered"
        ? a.Numbered - b.Numbered
        : b.kind === "InsideCoverFront"
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
  switch (page.kind) {
    case "InsideCoverFront":
      return { kind: "Numbered", Numbered: 1 }
    case "InsideCoverBack":
      return { kind: "InsideCoverFront" }
    case "Numbered":
      return { kind: "Numbered", Numbered: page.Numbered + 1 }
    default:
      return assertExhaustive(page)
  }
}

/**
 * Creates a page object for a page number.
 */
export const numberToPage = (number: number): Page => ({
  kind: "Numbered",
  Numbered: number,
})

/**
 * Returns a string representation of a page.
 */
export const printPage = (translate: Translate, page: Page) => {
  switch (page.kind) {
    case "InsideCoverFront":
      return translate("Front Cover Inside")
    case "InsideCoverBack":
      return translate("Back Cover Inside")
    case "Numbered":
      return page.Numbered.toFixed()
    default:
      return assertExhaustive(page)
  }
}
