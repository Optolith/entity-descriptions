import assert from "assert/strict"
import { describe, it } from "node:test"
import { Page } from "optolith-database-schema/types/source/_PublicationRef"
import { Translate } from "../../src/helpers/translate.js"
import {
  fromRawPageRange,
  normalizePageRanges,
  numberRangeToPageRange,
  PageRange,
  printPageRange,
  printPageRanges,
} from "../../src/references/pageRange.js"

const mockTranslate: Translate = (key: string) => key

const mockPage: Page = Object.freeze({ tag: "Numbered", numbered: 1 })
const mockPage2: Page = Object.freeze({ tag: "Numbered", numbered: 2 })
const mockPage3: Page = Object.freeze({ tag: "Numbered", numbered: 3 })

describe("numberRangeToPageRange", () => {
  it("should convert a numeric range to a page object range", () => {
    const input = { first_page: 1, last_page: 2 }
    const expected: PageRange = { firstPage: mockPage, lastPage: mockPage2 }
    assert.deepEqual(numberRangeToPageRange(input), expected)
  })

  it("should handle single page ranges", () => {
    const input = { first_page: 1 }
    const expected: PageRange = { firstPage: mockPage }
    assert.deepEqual(numberRangeToPageRange(input), expected)
  })
})

describe("fromRawPageRange", () => {
  it("should convert a raw page range to a local page object range", () => {
    const input = { first_page: mockPage, last_page: mockPage2 }
    const expected: PageRange = { firstPage: mockPage, lastPage: mockPage2 }
    assert.deepEqual(fromRawPageRange(input), expected)
  })

  it("should handle single page ranges", () => {
    const input = { first_page: mockPage }
    const expected: PageRange = { firstPage: mockPage }
    assert.deepEqual(fromRawPageRange(input), expected)
  })
})

describe("normalizePageRanges", () => {
  it("should sort and combine page ranges while removing duplicates", () => {
    const input: PageRange[] = [
      { firstPage: mockPage, lastPage: mockPage2 },
      { firstPage: mockPage2, lastPage: mockPage3 },
    ]
    const expected: PageRange[] = [{ firstPage: mockPage, lastPage: mockPage3 }]
    assert.deepEqual(normalizePageRanges(input), expected)
  })
})

describe("printPageRange", () => {
  it("should return a string representation of a page range", () => {
    const input: PageRange = { firstPage: mockPage, lastPage: mockPage2 }
    const expected = "1–2"
    assert.equal(printPageRange(mockTranslate, input), expected)
  })

  it("should handle single page ranges", () => {
    const input: PageRange = { firstPage: mockPage }
    const expected = "1"
    assert.equal(printPageRange(mockTranslate, input), expected)
  })
})

describe("printPageRanges", () => {
  it("should return a string representation of a list of page ranges", () => {
    const input: PageRange[] = [
      { firstPage: mockPage, lastPage: mockPage2 },
      { firstPage: mockPage3 },
    ]
    const expected = "1–2, 3"
    assert.equal(printPageRanges(mockTranslate, input), expected)
  })
})
