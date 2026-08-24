import { afterEach, describe, expect, it, vi } from "vitest";

describe("currencies", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("includes known currencies with resolved names", async () => {
    const { currencies } = await import("./currencies");
    expect(currencies.find((c) => c.code === "USD")?.name).toBe("US Dollar");
    expect(currencies.find((c) => c.code === "EUR")?.name).toBe("Euro");
  });

  it("is sorted alphabetically by name", async () => {
    const { currencies } = await import("./currencies");
    const names = currencies.map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it("has no duplicate currency codes", async () => {
    const { currencies } = await import("./currencies");
    const codes = currencies.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("falls back to the currency code when Intl.DisplayNames can't resolve a name", async () => {
    const original = Intl.DisplayNames;
    // @ts-expect-error -- stubbing the global for this test only
    Intl.DisplayNames = class {
      of() {
        return undefined;
      }
    };
    vi.resetModules();
    try {
      const { currencies } = await import("./currencies");
      expect(currencies.length).toBeGreaterThan(0);
      expect(currencies.every((c) => c.name === c.code)).toBe(true);
    } finally {
      Intl.DisplayNames = original;
    }
  });
});
