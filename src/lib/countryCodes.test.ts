import { describe, expect, it } from "vitest";
import { countryCodes, flagEmoji } from "./countryCodes";

describe("flagEmoji", () => {
  it("builds the regional-indicator flag for a country code", () => {
    expect(flagEmoji("US")).toBe("🇺🇸");
    expect(flagEmoji("ID")).toBe("🇮🇩");
  });

  it("is case-insensitive", () => {
    expect(flagEmoji("us")).toBe(flagEmoji("US"));
  });
});

describe("countryCodes", () => {
  it("is non-empty and every entry has a name, iso2, and dialCode", () => {
    expect(countryCodes.length).toBeGreaterThan(0);
    for (const c of countryCodes) {
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.iso2).toMatch(/^[A-Z]{2}$/);
      expect(c.dialCode).toMatch(/^\+\d+$/);
    }
  });

  it("includes Indonesia with dial code +62", () => {
    expect(countryCodes.find((c) => c.iso2 === "ID")?.dialCode).toBe("+62");
  });

  it("includes the United States with dial code +1", () => {
    expect(countryCodes.find((c) => c.iso2 === "US")?.dialCode).toBe("+1");
  });

  it("has no duplicate iso2 codes", () => {
    const codes = countryCodes.map((c) => c.iso2);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("is sorted numerically ascending by dial code", () => {
    const dialCodeNumbers = countryCodes.map((c) => Number(c.dialCode.slice(1)));
    for (let i = 1; i < dialCodeNumbers.length; i++) {
      expect(dialCodeNumbers[i]).toBeGreaterThanOrEqual(dialCodeNumbers[i - 1]);
    }
  });
});
