import { describe, expect, it } from "vitest";
import { entryTitle, hasContent, receiptTextInputFromSnapshot, type ReceiptSnapshot } from "./entries";
import type { SplitResult } from "./splitCalculator";

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

describe("receiptTextInputFromSnapshot", () => {
  const snapshot: ReceiptSnapshot = {
    step: "summary",
    receiptName: "Joe's Diner",
    receiptDate: "2026-08-23",
    people: [{ id: "p1", name: "Alice" }, { id: "p2", name: "Bob" }],
    items: [{ id: "i1", name: "Pizza", quantity: 1, unitPriceCents: 2000 }],
    taxCents: 100,
    serviceCents: 50,
    currency: "USD",
    splitMode: "assign",
    assignments: { i1: ["p1"] },
    visitedSteps: ["people", "items", "mode", "assign", "summary"],
    detectedRegion: "US",
    currencyAutoDetected: false,
  };
  const result: SplitResult = {
    personTotals: { p1: 2150, p2: 0 },
    personTaxCents: { p1: 100, p2: 0 },
    personServiceCents: { p1: 50, p2: 0 },
    itemSubtotalCents: 2000,
    grandTotalCents: 2150,
  };

  it("carries over the receipt name, formatted date, and totals", () => {
    const input = receiptTextInputFromSnapshot(snapshot, result);
    expect(input.receiptName).toBe("Joe's Diner");
    expect(input.dateLabel).toBe(new Date("2026-08-23").toLocaleDateString());
    expect(input.itemSubtotalCents).toBe(2000);
    expect(input.grandTotalCents).toBe(2150);
  });

  it("gives each person their total and only their assigned items", () => {
    const input = receiptTextInputFromSnapshot(snapshot, result);
    expect(input.people).toEqual([
      { name: "Alice", totalCents: 2150, itemNames: ["Pizza"] },
      { name: "Bob", totalCents: 0, itemNames: [] },
    ]);
  });

  it("omits the date label when the receipt has no date", () => {
    const input = receiptTextInputFromSnapshot({ ...snapshot, receiptDate: "" }, result);
    expect(input.dateLabel).toBe("");
  });
});
