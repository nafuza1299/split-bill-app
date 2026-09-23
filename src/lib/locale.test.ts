import { afterEach, describe, expect, it, vi } from "vitest";

describe("detectRegion", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("resolves the region from navigator.language", async () => {
    vi.stubGlobal("navigator", { language: "id-ID" });
    const { detectRegion } = await import("./locale");
    expect(detectRegion()).toBe("ID");
  });

  it("maximizes a language-only tag to its likely region", async () => {
    vi.stubGlobal("navigator", { language: "ja" });
    const { detectRegion } = await import("./locale");
    expect(detectRegion()).toBe("JP");
  });

  it("falls back to US when the locale can't be parsed", async () => {
    vi.stubGlobal("navigator", { language: "not-a-locale-tag-!!" });
    const { detectRegion } = await import("./locale");
    expect(detectRegion()).toBe("US");
  });

  it("falls back to US when a parseable locale resolves to no region", async () => {
    vi.stubGlobal("navigator", { language: "en" });
    const original = Intl.Locale;
    // @ts-expect-error -- stubbing the global for this test only
    Intl.Locale = class {
      maximize() {
        return { region: undefined };
      }
    };
    try {
      const { detectRegion } = await import("./locale");
      expect(detectRegion()).toBe("US");
    } finally {
      // @ts-expect-error -- restoring the stubbed global
      Intl.Locale = original;
    }
  });
});
