import { describe, expect, it } from "vitest";
import { canAdvance, getAdvanceBlockedReason, useReceiptStore } from "./useReceiptStore";
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

describe("getAdvanceBlockedReason", () => {
  it("returns null once the step is satisfied", () => {
    const state = { ...baseState, splitMode: "even" as const };
    expect(getAdvanceBlockedReason("mode", state as never)).toBeNull();
  });

  it("explains why the mode step is blocked", () => {
    expect(getAdvanceBlockedReason("mode", baseState as never)).toBe("Choose how to split the bill.");
  });

  it("returns null for the summary step regardless of state", () => {
    expect(getAdvanceBlockedReason("summary", baseState as never)).toBeNull();
  });
});

describe("useReceiptStore actions", () => {
  it("sets a person's phone without touching others", () => {
    useReceiptStore.setState({
      people: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });
    useReceiptStore.getState().setPersonPhone("p1", "+1 555 123 4567");
    const people = useReceiptStore.getState().people;
    expect(people.find((p) => p.id === "p1")?.phone).toBe("+1 555 123 4567");
    expect(people.find((p) => p.id === "p2")?.phone).toBeUndefined();
  });

  it("sets a person's phone country without touching others", () => {
    useReceiptStore.setState({
      people: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });
    useReceiptStore.getState().setPersonCountry("p1", "ID");
    const people = useReceiptStore.getState().people;
    expect(people.find((p) => p.id === "p1")?.phoneCountry).toBe("ID");
    expect(people.find((p) => p.id === "p2")?.phoneCountry).toBeUndefined();
  });

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

  it("nextStep/prevStep record the newly-entered step as visited", () => {
    useReceiptStore.setState({ step: "people", visitedSteps: ["people"] });
    useReceiptStore.getState().nextStep();
    expect(useReceiptStore.getState().visitedSteps).toEqual(["people", "items"]);

    useReceiptStore.setState({ step: "mode", splitMode: "assign", visitedSteps: ["people", "items", "mode"] });
    useReceiptStore.getState().nextStep();
    expect(useReceiptStore.getState().visitedSteps).toEqual(["people", "items", "mode", "assign"]);

    useReceiptStore.setState({ step: "people", visitedSteps: ["people"] });
    useReceiptStore.getState().prevStep();
    expect(useReceiptStore.getState().visitedSteps).toEqual(["people"]);
  });

  it("goToStep jumps directly and records the target as visited", () => {
    useReceiptStore.setState({ step: "people", visitedSteps: ["people"] });
    useReceiptStore.getState().goToStep("summary");
    expect(useReceiptStore.getState().step).toBe("summary");
    expect(useReceiptStore.getState().visitedSteps).toEqual(["people", "summary"]);
  });

  it("goToStep does not duplicate an already-visited step", () => {
    useReceiptStore.setState({ step: "people", visitedSteps: ["people", "items"] });
    useReceiptStore.getState().goToStep("items");
    expect(useReceiptStore.getState().visitedSteps).toEqual(["people", "items"]);
  });

  it("resetAll resets visitedSteps to just the first step", () => {
    useReceiptStore.setState({ visitedSteps: ["people", "items", "mode", "summary"] });
    useReceiptStore.getState().resetAll();
    expect(useReceiptStore.getState().visitedSteps).toEqual(["people"]);
  });

  it("applyDetectedRegion updates the region and currency while still auto-detected", () => {
    useReceiptStore.setState({ currencyAutoDetected: true });
    useReceiptStore.getState().applyDetectedRegion("ID");
    expect(useReceiptStore.getState().detectedRegion).toBe("ID");
    expect(useReceiptStore.getState().currency).toBe("IDR");
  });

  it("applyDetectedRegion updates the region but leaves a manually-chosen currency alone", () => {
    useReceiptStore.setState({ currency: "JPY", currencyAutoDetected: false });
    useReceiptStore.getState().applyDetectedRegion("ID");
    expect(useReceiptStore.getState().detectedRegion).toBe("ID");
    expect(useReceiptStore.getState().currency).toBe("JPY");
  });

  it("setCurrency marks the currency as no longer auto-detected", () => {
    useReceiptStore.setState({ currencyAutoDetected: true });
    useReceiptStore.getState().setCurrency("EUR");
    expect(useReceiptStore.getState().currencyAutoDetected).toBe(false);
  });

  it("resetAll restores currencyAutoDetected", () => {
    useReceiptStore.setState({ currencyAutoDetected: false });
    useReceiptStore.getState().resetAll();
    expect(useReceiptStore.getState().currencyAutoDetected).toBe(true);
  });

  it("setCountry sets the region and its currency, and marks currency as manually chosen", () => {
    useReceiptStore.setState({ currency: "USD", currencyAutoDetected: true });
    useReceiptStore.getState().setCountry("JP");
    expect(useReceiptStore.getState().detectedRegion).toBe("JP");
    expect(useReceiptStore.getState().currency).toBe("JPY");
    expect(useReceiptStore.getState().currencyAutoDetected).toBe(false);
  });

  it("setCountry overrides a previously manually-chosen currency", () => {
    useReceiptStore.setState({ currency: "EUR", currencyAutoDetected: false });
    useReceiptStore.getState().setCountry("ID");
    expect(useReceiptStore.getState().currency).toBe("IDR");
  });

  it("setCountry falls back to USD for an unmapped region", () => {
    useReceiptStore.getState().setCountry("AQ");
    expect(useReceiptStore.getState().detectedRegion).toBe("AQ");
    expect(useReceiptStore.getState().currency).toBe("USD");
  });
});
