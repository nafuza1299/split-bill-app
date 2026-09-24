import { describe, expect, it } from "vitest";
import { entryTitle, hasContent } from "./entries";

describe("hasContent", () => {
  it("is false with no people and no items", () => {
    expect(hasContent({ people: [], items: [] })).toBe(false);
  });

  it("is true once a person is added", () => {
    expect(hasContent({ people: [{ id: "1", name: "Ada" }], items: [] })).toBe(true);
  });

  it("is true once an item is added", () => {
    expect(
      hasContent({ people: [], items: [{ id: "1", name: "Pizza", quantity: 1, unitPriceCents: 100 }] }),
    ).toBe(true);
  });
});

describe("entryTitle", () => {
  it("falls back to a default when the receipt has no name", () => {
    expect(entryTitle({ receiptName: "" })).toBe("Untitled split");
    expect(entryTitle({ receiptName: "   " })).toBe("Untitled split");
  });

  it("uses the trimmed receipt name when set", () => {
    expect(entryTitle({ receiptName: "  Dinner  " })).toBe("Dinner");
  });
});
