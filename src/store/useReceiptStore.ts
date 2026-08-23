import { create } from "zustand";
import { calculateSplit } from "../lib/splitCalculator";
import type { ItemAssignments, Person, ReceiptItem, SplitMode, SplitResult } from "../lib/splitCalculator";
import { getDuplicateNameIndices, getMoneyError, getNameError, isItemValid } from "../lib/validation";

export type WizardStep = "people" | "items" | "mode" | "assign" | "summary";

interface ReceiptState {
  step: WizardStep;
  receiptName: string;
  receiptDate: string;
  people: Person[];
  items: ReceiptItem[];
  taxCents: number;
  serviceCents: number;
  splitMode: SplitMode | null;
  assignments: ItemAssignments;

  setReceiptName: (name: string) => void;
  setReceiptDate: (date: string) => void;
  addPerson: (name: string) => void;
  removePerson: (id: string) => void;
  renamePerson: (id: string, name: string) => void;
  addItem: () => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, patch: Partial<Omit<ReceiptItem, "id">>) => void;
  setTax: (cents: number) => void;
  setService: (cents: number) => void;
  setSplitMode: (mode: SplitMode) => void;
  toggleAssignment: (itemId: string, personId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const stepOrder: WizardStep[] = ["people", "items", "mode", "summary"];

function nextAfterMode(mode: SplitMode | null): WizardStep {
  return mode === "assign" ? "assign" : "summary";
}

export const useReceiptStore = create<ReceiptState>((set) => ({
  step: "people",
  receiptName: "",
  receiptDate: "",
  people: [],
  items: [],
  taxCents: 0,
  serviceCents: 0,
  splitMode: null,
  assignments: {},

  setReceiptName: (name) => set({ receiptName: name }),
  setReceiptDate: (date) => set({ receiptDate: date }),
  addPerson: (name) =>
    set((s) => ({ people: [...s.people, { id: crypto.randomUUID(), name }] })),
  removePerson: (id) =>
    set((s) => ({
      people: s.people.filter((p) => p.id !== id),
      assignments: Object.fromEntries(
        Object.entries(s.assignments).map(([itemId, personIds]) => [
          itemId,
          personIds.filter((pid) => pid !== id),
        ]),
      ),
    })),
  renamePerson: (id, name) =>
    set((s) => ({ people: s.people.map((p) => (p.id === id ? { ...p, name } : p)) })),

  addItem: () =>
    set((s) => ({
      items: [...s.items, { id: crypto.randomUUID(), name: "", quantity: 1, unitPriceCents: 0 }],
    })),
  removeItem: (id) =>
    set((s) => {
      const { [id]: _removed, ...assignments } = s.assignments;
      return { items: s.items.filter((i) => i.id !== id), assignments };
    }),
  updateItem: (id, patch) =>
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),

  setTax: (cents) => set({ taxCents: cents }),
  setService: (cents) => set({ serviceCents: cents }),
  setSplitMode: (mode) => set({ splitMode: mode }),

  toggleAssignment: (itemId, personId) =>
    set((s) => {
      const current = s.assignments[itemId] ?? [];
      const next = current.includes(personId)
        ? current.filter((id) => id !== personId)
        : [...current, personId];
      return { assignments: { ...s.assignments, [itemId]: next } };
    }),

  nextStep: () =>
    set((s) => {
      if (s.step === "mode") return { step: nextAfterMode(s.splitMode) };
      if (s.step === "assign") return { step: "summary" };
      const i = stepOrder.indexOf(s.step);
      return { step: stepOrder[Math.min(i + 1, stepOrder.length - 1)] };
    }),
  prevStep: () =>
    set((s) => {
      if (s.step === "summary") return { step: nextAfterMode(s.splitMode) === "assign" ? "assign" : "mode" };
      if (s.step === "assign") return { step: "mode" };
      const i = stepOrder.indexOf(s.step);
      return { step: stepOrder[Math.max(i - 1, 0)] };
    }),
}));

export function canAdvance(step: WizardStep, state: ReceiptState): boolean {
  switch (step) {
    case "people": {
      const duplicateIndices = getDuplicateNameIndices(state.people.map((p) => p.name));
      return (
        state.people.filter((p, i) => getNameError(p.name) === null && !duplicateIndices.has(i)).length >= 2
      );
    }
    case "items": {
      const duplicateIndices = getDuplicateNameIndices(state.items.map((i) => i.name));
      return (
        state.items.length > 0 &&
        state.items.every((item, i) => isItemValid(item) && !duplicateIndices.has(i)) &&
        getMoneyError(state.taxCents) === null &&
        getMoneyError(state.serviceCents) === null
      );
    }
    case "mode":
      return state.splitMode !== null;
    case "assign":
      return state.items.every((item) => (state.assignments[item.id] ?? []).length > 0);
    case "summary":
      return false;
  }
}

export function useSplitResult(): SplitResult {
  const { people, items, taxCents, serviceCents, splitMode, assignments } = useReceiptStore();
  return calculateSplit({
    people,
    items,
    taxCents,
    serviceCents,
    mode: splitMode ?? "even",
    assignments,
  });
}
