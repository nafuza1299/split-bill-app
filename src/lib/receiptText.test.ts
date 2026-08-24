import { describe, expect, it } from "vitest";
import { formatReceiptText, sanitizeFilename } from "./receiptText";
import type { ReceiptItem } from "./splitCalculator";

describe("formatReceiptText", () => {
  const items: ReceiptItem[] = [
    { id: "i1", name: "Pizza", quantity: 1, unitPriceCents: 2000 },
    { id: "i2", name: "Coffee", quantity: 2, unitPriceCents: 500 },
  ];

  it("includes the receipt name and date at the top", () => {
    const text = formatReceiptText({
      receiptName: "Joe's Diner",
      dateLabel: "8/23/2026",
      items,
      taxCents: 250,
      serviceCents: 100,
      itemSubtotalCents: 3000,
      grandTotalCents: 3350,
      currency: "USD",
      people: [],
    });
    const lines = text.split("\n");
    expect(lines[0]).toBe("Joe's Diner");
    expect(lines[1]).toBe("8/23/2026");
  });

  it("falls back to 'Receipt' and omits the date line when empty", () => {
    const text = formatReceiptText({
      receiptName: "",
      dateLabel: "",
      items: [],
      taxCents: 0,
      serviceCents: 0,
      itemSubtotalCents: 0,
      grandTotalCents: 0,
      currency: "USD",
      people: [],
    });
    const lines = text.split("\n");
    expect(lines[0]).toBe("Receipt");
    expect(lines[1]).toBe("");
  });

  it("lists each item with its line total", () => {
    const text = formatReceiptText({
      receiptName: "Receipt",
      dateLabel: "",
      items,
      taxCents: 0,
      serviceCents: 0,
      itemSubtotalCents: 3000,
      grandTotalCents: 3000,
      currency: "USD",
      people: [],
    });
    expect(text).toContain("Pizza × 1 — $20.00");
    expect(text).toContain("Coffee × 2 — $10.00");
  });

  it("includes subtotal/tax/service/total lines", () => {
    const text = formatReceiptText({
      receiptName: "Receipt",
      dateLabel: "",
      items: [],
      taxCents: 250,
      serviceCents: 100,
      itemSubtotalCents: 3000,
      grandTotalCents: 3350,
      currency: "USD",
      people: [],
    });
    expect(text).toContain("Subtotal: $30.00");
    expect(text).toContain("Tax: $2.50");
    expect(text).toContain("Service charge: $1.00");
    expect(text).toContain("Total: $33.50");
  });

  it("lists each person's total and assigned items", () => {
    const text = formatReceiptText({
      receiptName: "Receipt",
      dateLabel: "",
      items: [],
      taxCents: 0,
      serviceCents: 0,
      itemSubtotalCents: 0,
      grandTotalCents: 3000,
      currency: "USD",
      people: [
        { name: "Alice", totalCents: 1650, itemNames: ["Pizza", "Coffee"] },
        { name: "Bob", totalCents: 1000, itemNames: [] },
      ],
    });
    expect(text).toContain("Alice — $16.50 (Pizza, Coffee)");
    expect(text).toContain("Bob — $10.00");
    expect(text).not.toContain("Bob — $10.00 (");
  });

  it("adds thousands separators to large amounts", () => {
    const text = formatReceiptText({
      receiptName: "Receipt",
      dateLabel: "",
      items: [{ id: "i1", name: "Catering", quantity: 1, unitPriceCents: 123456789 }],
      taxCents: 0,
      serviceCents: 0,
      itemSubtotalCents: 123456789,
      grandTotalCents: 123456789,
      currency: "USD",
      people: [{ name: "Alice", totalCents: 123456789, itemNames: [] }],
    });
    expect(text).toContain("Catering × 1 — $1,234,567.89");
    expect(text).toContain("Subtotal: $1,234,567.89");
    expect(text).toContain("Alice — $1,234,567.89");
  });
});

describe("sanitizeFilename", () => {
  it("falls back to 'receipt' for empty or whitespace-only input", () => {
    expect(sanitizeFilename("")).toBe("receipt");
    expect(sanitizeFilename("   ")).toBe("receipt");
  });

  it("strips special characters", () => {
    expect(sanitizeFilename("Joe's Diner!")).toBe("Joes-Diner");
  });

  it("collapses spaces to single hyphens", () => {
    expect(sanitizeFilename("  Team   Lunch  ")).toBe("Team-Lunch");
  });

  it("leaves already-clean names unchanged", () => {
    expect(sanitizeFilename("already-clean")).toBe("already-clean");
  });
});
