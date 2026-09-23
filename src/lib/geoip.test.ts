import { afterEach, describe, expect, it, vi } from "vitest";
import { detectRegionByIp } from "./geoip";

describe("detectRegionByIp", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("resolves the country from a successful response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ country: "ID" }) }),
    );
    expect(await detectRegionByIp()).toBe("ID");
  });

  it("resolves null when the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    expect(await detectRegionByIp()).toBeNull();
  });

  it("resolves null when the country field is missing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
    expect(await detectRegionByIp()).toBeNull();
  });

  it("resolves null when the country field isn't a two-letter code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ country: "Indonesia" }) }),
    );
    expect(await detectRegionByIp()).toBeNull();
  });

  it("resolves null on a network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await detectRegionByIp()).toBeNull();
  });

  it("resolves null when the request times out", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url: string, { signal }: { signal: AbortSignal }) => {
        return new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        });
      }),
    );
    const result = detectRegionByIp();
    await vi.advanceTimersByTimeAsync(3000);
    expect(await result).toBeNull();
  });
});
