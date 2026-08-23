import { describe, expect, it } from "vitest";
import {
  countDigitsBefore,
  formatMoney,
  formatWithThousandsSeparators,
  indexAfterDigits,
  isPartialMoneyText,
  stripCommas,
} from "./money";

describe("isPartialMoneyText", () => {
  it("accepts digits, a decimal point, and empty string", () => {
    expect(isPartialMoneyText("")).toBe(true);
    expect(isPartialMoneyText("5")).toBe(true);
    expect(isPartialMoneyText("5.")).toBe(true);
    expect(isPartialMoneyText("5.99")).toBe(true);
  });

  it("rejects letters and symbols", () => {
    expect(isPartialMoneyText("abc")).toBe(false);
    expect(isPartialMoneyText("5a")).toBe(false);
    expect(isPartialMoneyText("-5")).toBe(false);
    expect(isPartialMoneyText("5.9.9")).toBe(false);
  });
});

describe("stripCommas", () => {
  it("removes every comma", () => expect(stripCommas("1,234,567.89")).toBe("1234567.89"));
  it("leaves comma-free text untouched", () => expect(stripCommas("42.5")).toBe("42.5"));
});

describe("formatWithThousandsSeparators", () => {
  it("groups the integer part into thousands", () => {
    expect(formatWithThousandsSeparators("1234")).toBe("1,234");
    expect(formatWithThousandsSeparators("1234567")).toBe("1,234,567");
  });
  it("leaves numbers under 1000 ungrouped", () => expect(formatWithThousandsSeparators("999")).toBe("999"));
  it("preserves the decimal part, including a trailing dot", () => {
    expect(formatWithThousandsSeparators("1234.5")).toBe("1,234.5");
    expect(formatWithThousandsSeparators("1234.")).toBe("1,234.");
  });
  it("handles an empty string", () => expect(formatWithThousandsSeparators("")).toBe(""));
});

describe("formatMoney", () => {
  it("adds thousands separators for large amounts", () => expect(formatMoney(123456789)).toBe("1,234,567.89"));
  it("leaves small amounts ungrouped", () => expect(formatMoney(2000)).toBe("20.00"));
  it("always shows two decimal places", () => expect(formatMoney(0)).toBe("0.00"));
});

describe("countDigitsBefore / indexAfterDigits round-trip", () => {
  it("finds the same digit position after grouping is applied", () => {
    // Cursor right after "234" in "1234.5" (raw, no commas) is digit-count 4.
    const digitsBefore = countDigitsBefore("1234.5", 4);
    expect(digitsBefore).toBe(4);
    // After formatting to "1,234.5", the same 4th digit sits right after the comma.
    const formatted = formatWithThousandsSeparators("1234.5");
    expect(indexAfterDigits(formatted, digitsBefore)).toBe(formatted.indexOf("4") + 1);
  });
  it("indexAfterDigits(text, 0) is always the start", () => {
    expect(indexAfterDigits("1,234", 0)).toBe(0);
  });
  it("indexAfterDigits beyond the last digit clamps to the string end", () => {
    expect(indexAfterDigits("1,234", 99)).toBe("1,234".length);
  });
});
