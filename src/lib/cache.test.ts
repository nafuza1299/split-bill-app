import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createExpiringStorage } from "./cache";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

describe("createExpiringStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null for a key that was never written", () => {
    const storage = createExpiringStorage(ONE_DAY_MS);
    expect(storage.getItem("missing")).toBeNull();
  });

  it("returns the value when read within the TTL", () => {
    const storage = createExpiringStorage(ONE_DAY_MS);
    storage.setItem("key", { state: { foo: "bar" } });
    expect(storage.getItem("key")).toEqual({ state: { foo: "bar" } });
  });

  it("expires and clears the value once the TTL has passed", () => {
    const storage = createExpiringStorage(ONE_DAY_MS);
    storage.setItem("key", { state: { foo: "bar" } });
    vi.advanceTimersByTime(ONE_DAY_MS + 1);
    expect(storage.getItem("key")).toBeNull();
    expect(localStorage.getItem("key")).toBeNull();
  });
});
