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
});
