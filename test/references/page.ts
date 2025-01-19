import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  comparePage,
  equalsPage,
  numberToPage,
  printPage,
  succ,
} from "../../src/references/page.js"

describe("comparePage", () => {
  it("returns 0 if the pages are equal", () => {
    assert.equal(
      comparePage(
        { tag: "InsideCoverBack", inside_cover_back: {} },
        { tag: "InsideCoverBack", inside_cover_back: {} },
      ),
      0,
    )
    assert.equal(
      comparePage(
        { tag: "InsideCoverFront", inside_cover_front: {} },
        { tag: "InsideCoverFront", inside_cover_front: {} },
      ),
      0,
    )
    assert.equal(
      comparePage(
        { tag: "Numbered", numbered: 42 },
        { tag: "Numbered", numbered: 42 },
      ),
      0,
    )
  })

  it("returns a negative number if first should be sorted before the second", () => {
    assert.equal(
      comparePage(
        { tag: "InsideCoverFront", inside_cover_front: {} },
        { tag: "InsideCoverBack", inside_cover_back: {} },
      ),
      -1,
    )
    assert.equal(
      comparePage(
        { tag: "InsideCoverFront", inside_cover_front: {} },
        { tag: "Numbered", numbered: 42 },
      ),
      -1,
    )
    assert.equal(
      comparePage(
        { tag: "Numbered", numbered: 42 },
        { tag: "InsideCoverBack", inside_cover_back: {} },
      ),
      -1,
    )
    assert.equal(
      comparePage(
        { tag: "Numbered", numbered: 24 },
        { tag: "Numbered", numbered: 42 },
      ),
      -18,
    )
  })

  it("returns a positive number if first should be sorted after the second", () => {
    assert.equal(
      comparePage(
        { tag: "InsideCoverBack", inside_cover_back: {} },
        { tag: "InsideCoverFront", inside_cover_front: {} },
      ),
      1,
    )
    assert.equal(
      comparePage(
        { tag: "Numbered", numbered: 42 },
        { tag: "InsideCoverFront", inside_cover_front: {} },
      ),
      1,
    )
    assert.equal(
      comparePage(
        { tag: "InsideCoverBack", inside_cover_back: {} },
        { tag: "Numbered", numbered: 42 },
      ),
      1,
    )
    assert.equal(
      comparePage(
        { tag: "Numbered", numbered: 42 },
        { tag: "Numbered", numbered: 24 },
      ),
      18,
    )
  })
})

describe("equalsPage", () => {
  it("returns true if the pages are equal", () => {
    assert.equal(
      equalsPage(
        { tag: "InsideCoverBack", inside_cover_back: {} },
        { tag: "InsideCoverBack", inside_cover_back: {} },
      ),
      true,
    )
    assert.equal(
      equalsPage(
        { tag: "InsideCoverFront", inside_cover_front: {} },
        { tag: "InsideCoverFront", inside_cover_front: {} },
      ),
      true,
    )
    assert.equal(
      equalsPage(
        { tag: "Numbered", numbered: 42 },
        { tag: "Numbered", numbered: 42 },
      ),
      true,
    )
  })

  it("returns false if the pages are not equal", () => {
    assert.equal(
      equalsPage(
        { tag: "InsideCoverFront", inside_cover_front: {} },
        { tag: "InsideCoverBack", inside_cover_back: {} },
      ),
      false,
    )
    assert.equal(
      equalsPage(
        { tag: "InsideCoverFront", inside_cover_front: {} },
        { tag: "Numbered", numbered: 42 },
      ),
      false,
    )
    assert.equal(
      equalsPage(
        { tag: "Numbered", numbered: 42 },
        { tag: "InsideCoverBack", inside_cover_back: {} },
      ),
      false,
    )
    assert.equal(
      equalsPage(
        { tag: "Numbered", numbered: 24 },
        { tag: "Numbered", numbered: 42 },
      ),
      false,
    )
    assert.equal(
      equalsPage(
        { tag: "InsideCoverBack", inside_cover_back: {} },
        { tag: "InsideCoverFront", inside_cover_front: {} },
      ),
      false,
    )
    assert.equal(
      equalsPage(
        { tag: "Numbered", numbered: 42 },
        { tag: "InsideCoverFront", inside_cover_front: {} },
      ),
      false,
    )
    assert.equal(
      equalsPage(
        { tag: "InsideCoverBack", inside_cover_back: {} },
        { tag: "Numbered", numbered: 42 },
      ),
      false,
    )
    assert.equal(
      equalsPage(
        { tag: "Numbered", numbered: 42 },
        { tag: "Numbered", numbered: 24 },
      ),
      false,
    )
  })
})

describe("succ", () => {
  it("returns the next page", () => {
    assert.deepEqual(
      succ({ tag: "InsideCoverFront", inside_cover_front: {} }),
      { tag: "Numbered", numbered: 1 },
    )
    assert.deepEqual(succ({ tag: "Numbered", numbered: 42 }), {
      tag: "Numbered",
      numbered: 43,
    })
  })
})

describe("numberToPage", () => {
  it("returns a page object for the page number", () => {
    assert.deepEqual(numberToPage(42), { tag: "Numbered", numbered: 42 })
  })
})

describe("printPage", () => {
  it("returns a string representation of the page", () => {
    assert.equal(
      printPage(() => "Front Cover Inside", {
        tag: "InsideCoverFront",
        inside_cover_front: {},
      }),
      "Front Cover Inside",
    )
    assert.equal(
      printPage(() => "Back Cover Inside", {
        tag: "InsideCoverBack",
        inside_cover_back: {},
      }),
      "Back Cover Inside",
    )
    assert.equal(
      printPage(() => "", { tag: "Numbered", numbered: 42 }),
      "42",
    )
  })
})
