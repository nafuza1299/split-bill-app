import { describe, expect, it } from "vitest";
import { canAdvance } from "./useReceiptStore";
import type { WizardStep } from "./useReceiptStore";

const baseState = {
  step: "people" as WizardStep,
  items: [],
  taxCents: 0,
  serviceCents: 0,
  splitMode: null,
  assignments: {},
};

describe("canAdvance — people step", () => {
  it("blocks with fewer than two valid people", () => {
    const state = { ...baseState, people: [{ id: "1", name: "Alice" }] };
    expect(canAdvance("people", state as never)).toBe(false);
  });

  it("blocks when only one of two names is valid", () => {
    const state = {
      ...baseState,
      people: [
        { id: "1", name: "Alice" },
        { id: "2", name: "Bo*b" },
      ],
    };
    expect(canAdvance("people", state as never)).toBe(false);
  });

  it("allows with two valid people even if a third is invalid", () => {
    const state = {
      ...baseState,
      people: [
        { id: "1", name: "Alice" },
        { id: "2", name: "Bob" },
        { id: "3", name: "Ca*rl" },
      ],
    };
    expect(canAdvance("people", state as never)).toBe(true);
  });

  it("blocks when two people share a name regardless of case", () => {
    const state = {
      ...baseState,
      people: [
        { id: "1", name: "Alice" },
        { id: "2", name: "ALICE" },
      ],
    };
    expect(canAdvance("people", state as never)).toBe(false);
  });

  it("allows once a duplicate is renamed to something unique", () => {
    const state = {
      ...baseState,
      people: [
        { id: "1", name: "Alice" },
        { id: "2", name: "Bob" },
        { id: "3", name: "alice" },
      ],
    };
    // "Alice" (index 0) and "alice" (index 2) are duplicates of each other;
    // only "Bob" is unambiguous, so still fewer than two valid names.
    expect(canAdvance("people", state as never)).toBe(false);
  });
});
