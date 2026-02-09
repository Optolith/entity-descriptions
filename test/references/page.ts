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
      comparePage({ kind: "InsideCoverBack" }, { kind: "InsideCoverBack" }),
      0,
    )
    assert.equal(
      comparePage({ kind: "InsideCoverFront" }, { kind: "InsideCoverFront" }),
      0,
    )
    assert.equal(
      comparePage(
        { kind: "Numbered", Numbered: 42 },
        { kind: "Numbered", Numbered: 42 },
      ),
      0,
    )
  })

  it("returns a negative number if first should be sorted before the second", () => {
    assert.equal(
      comparePage({ kind: "InsideCoverFront" }, { kind: "InsideCoverBack" }),
      -1,
    )
    assert.equal(
      comparePage(
        { kind: "InsideCoverFront" },
        { kind: "Numbered", Numbered: 42 },
      ),
      -1,
    )
    assert.equal(
      comparePage(
        { kind: "Numbered", Numbered: 42 },
        { kind: "InsideCoverBack" },
      ),
      -1,
    )
    assert.equal(
      comparePage(
        { kind: "Numbered", Numbered: 24 },
        { kind: "Numbered", Numbered: 42 },
      ),
      -18,
    )
  })

  it("returns a positive number if first should be sorted after the second", () => {
    assert.equal(
      comparePage({ kind: "InsideCoverBack" }, { kind: "InsideCoverFront" }),
      1,
    )
    assert.equal(
      comparePage(
        { kind: "Numbered", Numbered: 42 },
        { kind: "InsideCoverFront" },
      ),
      1,
    )
    assert.equal(
      comparePage(
        { kind: "InsideCoverBack" },
        { kind: "Numbered", Numbered: 42 },
      ),
      1,
    )
    assert.equal(
      comparePage(
        { kind: "Numbered", Numbered: 42 },
        { kind: "Numbered", Numbered: 24 },
      ),
      18,
    )
  })
})

describe("equalsPage", () => {
  it("returns true if the pages are equal", () => {
    assert.equal(
      equalsPage({ kind: "InsideCoverBack" }, { kind: "InsideCoverBack" }),
      true,
    )
    assert.equal(
      equalsPage({ kind: "InsideCoverFront" }, { kind: "InsideCoverFront" }),
      true,
    )
    assert.equal(
      equalsPage(
        { kind: "Numbered", Numbered: 42 },
        { kind: "Numbered", Numbered: 42 },
      ),
      true,
    )
  })

  it("returns false if the pages are not equal", () => {
    assert.equal(
      equalsPage({ kind: "InsideCoverFront" }, { kind: "InsideCoverBack" }),
      false,
    )
    assert.equal(
      equalsPage(
        { kind: "InsideCoverFront" },
        { kind: "Numbered", Numbered: 42 },
      ),
      false,
    )
    assert.equal(
      equalsPage(
        { kind: "Numbered", Numbered: 42 },
        { kind: "InsideCoverBack" },
      ),
      false,
    )
    assert.equal(
      equalsPage(
        { kind: "Numbered", Numbered: 24 },
        { kind: "Numbered", Numbered: 42 },
      ),
      false,
    )
    assert.equal(
      equalsPage({ kind: "InsideCoverBack" }, { kind: "InsideCoverFront" }),
      false,
    )
    assert.equal(
      equalsPage(
        { kind: "Numbered", Numbered: 42 },
        { kind: "InsideCoverFront" },
      ),
      false,
    )
    assert.equal(
      equalsPage(
        { kind: "InsideCoverBack" },
        { kind: "Numbered", Numbered: 42 },
      ),
      false,
    )
    assert.equal(
      equalsPage(
        { kind: "Numbered", Numbered: 42 },
        { kind: "Numbered", Numbered: 24 },
      ),
      false,
    )
  })
})

describe("succ", () => {
  it("returns the next page", () => {
    assert.deepEqual(succ({ kind: "InsideCoverFront" }), {
      kind: "Numbered",
      Numbered: 1,
    })
    assert.deepEqual(succ({ kind: "Numbered", Numbered: 42 }), {
      kind: "Numbered",
      Numbered: 43,
    })
  })
})

describe("numberToPage", () => {
  it("returns a page object for the page number", () => {
    assert.deepEqual(numberToPage(42), { kind: "Numbered", Numbered: 42 })
  })
})

describe("printPage", () => {
  it("returns a string representation of the page", () => {
    assert.equal(
      printPage(() => "Front Cover Inside", {
        kind: "InsideCoverFront",
      }),
      "Front Cover Inside",
    )
    assert.equal(
      printPage(() => "Back Cover Inside", {
        kind: "InsideCoverBack",
      }),
      "Back Cover Inside",
    )
    assert.equal(
      printPage(() => "", { kind: "Numbered", Numbered: 42 }),
      "42",
    )
  })
})
