import { describe, expect, it } from "vitest";
import { isPartialMoneyText } from "./money";

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
