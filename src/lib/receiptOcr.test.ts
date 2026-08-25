import { describe, expect, it } from "vitest";
import { parseReceiptText } from "./receiptOcr";

describe("parseReceiptText", () => {
  it("parses a typical multi-item receipt", () => {
    const text = ["Coffee 4.50", "Bagel 3.25", "Subtotal 7.75", "Tax 0.62", "Total 8.37"].join("\n");
    expect(parseReceiptText(text)).toEqual([
      { name: "Coffee", quantity: 1, unitPriceCents: 450 },
      { name: "Bagel", quantity: 1, unitPriceCents: 325 },
    ]);
  });

  it("parses a leading quantity prefix", () => {
    expect(parseReceiptText("2x Coffee 9.00")).toEqual([
      { name: "Coffee", quantity: 2, unitPriceCents: 900 },
    ]);
  });

  it("strips dot-leaders between name and price", () => {
    expect(parseReceiptText("Coffee .......... 4.50")).toEqual([
      { name: "Coffee", quantity: 1, unitPriceCents: 450 },
    ]);
  });

  it("skips stoplist lines regardless of case", () => {
    const text = ["TOTAL 12.00", "Sub Total 10.00", "Change 2.00", "Cash 12.00"].join("\n");
    expect(parseReceiptText(text)).toEqual([]);
  });

  it("returns an empty array for empty text", () => {
    expect(parseReceiptText("")).toEqual([]);
  });

  it("skips lines with no trailing price", () => {
    expect(parseReceiptText("Thank you for shopping with us")).toEqual([]);
  });

  it("skips a line with a zero price", () => {
    expect(parseReceiptText("Free sample 0.00")).toEqual([]);
  });

  it("handles thousands separators in the price", () => {
    expect(parseReceiptText("Gift card 1,250.00")).toEqual([
      { name: "Gift card", quantity: 1, unitPriceCents: 125000 },
    ]);
  });

  it("parses dot-grouped-thousands prices with no decimal fraction", () => {
    expect(parseReceiptText("BEEF OMURICE 79.000")).toEqual([
      { name: "BEEF OMURICE", quantity: 1, unitPriceCents: 7900000 },
    ]);
  });

  it("parses a leading quantity column separated by multiple spaces", () => {
    expect(parseReceiptText("2  CHEESE OMURICE 30.000")).toEqual([
      { name: "CHEESE OMURICE", quantity: 2, unitPriceCents: 3000000 },
    ]);
  });

  it("parses a leading quantity column even when OCR collapses the gap to a single space", () => {
    expect(parseReceiptText("2 CHEESE OMURICE 30.000")).toEqual([
      { name: "CHEESE OMURICE", quantity: 2, unitPriceCents: 3000000 },
    ]);
  });

  it("parses a real Indonesian restaurant receipt (matching actual OCR output spacing)", () => {
    const text = [
      "1 BEEF OMURICE              79.000",
      "1 CHICKEN OMURICE          65.000",
      "2 CHEESE OMURICE            30.000",
      "1 RED DRAGON                95.000",
      "1 SPICY TUNA MAKIMONO      35.000",
      "1 GREEN MIX                  37.000",
      "1 MANGO YAKULT                     39.000",
      "Subtotal                           380.000",
      "Service Charge             30.400",
      "PB1                                      41.040",
      "Grand Total               451.440",
    ].join("\n");

    expect(parseReceiptText(text)).toEqual([
      { name: "BEEF OMURICE", quantity: 1, unitPriceCents: 7900000 },
      { name: "CHICKEN OMURICE", quantity: 1, unitPriceCents: 6500000 },
      { name: "CHEESE OMURICE", quantity: 2, unitPriceCents: 3000000 },
      { name: "RED DRAGON", quantity: 1, unitPriceCents: 9500000 },
      { name: "SPICY TUNA MAKIMONO", quantity: 1, unitPriceCents: 3500000 },
      { name: "GREEN MIX", quantity: 1, unitPriceCents: 3700000 },
      { name: "MANGO YAKULT", quantity: 1, unitPriceCents: 3900000 },
    ]);
  });
});
