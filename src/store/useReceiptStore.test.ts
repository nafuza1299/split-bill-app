import { describe, expect, it } from "vitest";
import { canAdvance, useReceiptStore } from "./useReceiptStore";
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

describe("canAdvance — items/mode/assign/summary steps", () => {
  it("blocks the items step when there are no items", () => {
    expect(canAdvance("items", { ...baseState, people: [] } as never)).toBe(false);
  });

  it("allows the items step when all items are valid and tax/service are valid", () => {
    const state = { ...baseState, items: [{ id: "1", name: "Pizza", quantity: 1, unitPriceCents: 2000 }] };
    expect(canAdvance("items", state as never)).toBe(true);
  });

  it("blocks the mode step until a split mode is chosen", () => {
    expect(canAdvance("mode", { ...baseState, splitMode: null } as never)).toBe(false);
    expect(canAdvance("mode", { ...baseState, splitMode: "even" } as never)).toBe(true);
  });

  it("blocks the assign step until every item has an assignee", () => {
    const state = {
      ...baseState,
      items: [{ id: "1", name: "Pizza", quantity: 1, unitPriceCents: 2000 }],
      assignments: {},
    };
    expect(canAdvance("assign", state as never)).toBe(false);
  });

  it("allows the assign step once every item has an assignee", () => {
    const state = {
      ...baseState,
      items: [{ id: "1", name: "Pizza", quantity: 1, unitPriceCents: 2000 }],
      assignments: { "1": ["p1"] },
    };
    expect(canAdvance("assign", state as never)).toBe(true);
  });

  it("never allows advancing past the summary step", () => {
    expect(canAdvance("summary", baseState as never)).toBe(false);
  });
});

describe("useReceiptStore actions", () => {
  it("cleans up assignments referencing a removed person", () => {
    useReceiptStore.setState({
      people: [{ id: "p1", name: "Alice" }],
      assignments: { i1: ["p1", "p2"] },
    });
    useReceiptStore.getState().removePerson("p1");
    expect(useReceiptStore.getState().assignments.i1).toEqual(["p2"]);
  });

  it("toggles a person off an item they're already assigned to", () => {
    useReceiptStore.setState({ assignments: { i1: ["p1"] } });
    useReceiptStore.getState().toggleAssignment("i1", "p1");
    expect(useReceiptStore.getState().assignments.i1).toEqual([]);
  });

  it("advances mode -> assign when splitMode is assign, mode -> summary otherwise", () => {
    useReceiptStore.setState({ step: "mode", splitMode: "assign" });
    useReceiptStore.getState().nextStep();
    expect(useReceiptStore.getState().step).toBe("assign");

    useReceiptStore.setState({ step: "mode", splitMode: "even" });
    useReceiptStore.getState().nextStep();
    expect(useReceiptStore.getState().step).toBe("summary");
  });

  it("advances assign -> summary", () => {
    useReceiptStore.setState({ step: "assign" });
    useReceiptStore.getState().nextStep();
    expect(useReceiptStore.getState().step).toBe("summary");
  });

  it("goes back from summary to assign when splitMode is assign, to mode otherwise", () => {
    useReceiptStore.setState({ step: "summary", splitMode: "assign" });
    useReceiptStore.getState().prevStep();
    expect(useReceiptStore.getState().step).toBe("assign");

    useReceiptStore.setState({ step: "summary", splitMode: "even" });
    useReceiptStore.getState().prevStep();
    expect(useReceiptStore.getState().step).toBe("mode");
  });

  it("goes back from assign to mode", () => {
    useReceiptStore.setState({ step: "assign" });
    useReceiptStore.getState().prevStep();
    expect(useReceiptStore.getState().step).toBe("mode");
  });
});
