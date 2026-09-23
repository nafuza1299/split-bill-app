import { create } from "zustand";
import { persist } from "zustand/middleware";
import { calculateSplit } from "../lib/splitCalculator";
import type { ItemAssignments, Person, ReceiptItem, SplitMode, SplitResult } from "../lib/splitCalculator";
import { getDuplicateNameIndices, getMoneyError, getNameError, isItemValid } from "../lib/validation";
import { createExpiringStorage } from "../lib/cache";
import { currencyForRegion, defaultCurrency } from "../lib/currencies";
import { detectRegion } from "../lib/locale";

export type WizardStep = "people" | "items" | "mode" | "assign" | "summary";

interface ReceiptState {
  step: WizardStep;
  receiptName: string;
  receiptDate: string;
  people: Person[];
  items: ReceiptItem[];
  taxCents: number;
  serviceCents: number;
  currency: string;
  splitMode: SplitMode | null;
  assignments: ItemAssignments;
  visitedSteps: WizardStep[];
  /** Best-guess ISO 3166-1 region, refined once an IP lookup resolves. Also the phone-country fallback for new people. */
  detectedRegion: string;
  /** False once the user has manually picked a currency - keeps a later IP lookup from overwriting their choice. */
  currencyAutoDetected: boolean;

  setReceiptName: (name: string) => void;
  setReceiptDate: (date: string) => void;
  addPerson: (name: string) => void;
  removePerson: (id: string) => void;
  renamePerson: (id: string, name: string) => void;
  setPersonPhone: (id: string, phone: string) => void;
  setPersonCountry: (id: string, phoneCountry: string) => void;
  addItem: () => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, patch: Partial<Omit<ReceiptItem, "id">>) => void;
  setTax: (cents: number) => void;
  setService: (cents: number) => void;
  setCurrency: (currency: string) => void;
  setSplitMode: (mode: SplitMode) => void;
  toggleAssignment: (itemId: string, personId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: WizardStep) => void;
  applyDetectedRegion: (region: string) => void;
  resetAll: () => void;
}

const initialData = {
  step: "people" as WizardStep,
  receiptName: "",
  receiptDate: "",
  people: [] as Person[],
  items: [] as ReceiptItem[],
  taxCents: 0,
  serviceCents: 0,
  currency: defaultCurrency(),
  splitMode: null as SplitMode | null,
  assignments: {} as ItemAssignments,
  visitedSteps: ["people"] as WizardStep[],
  detectedRegion: detectRegion(),
  currencyAutoDetected: true,
};

const stepOrder: WizardStep[] = ["people", "items", "mode", "summary"];
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function nextAfterMode(mode: SplitMode | null): WizardStep {
  return mode === "assign" ? "assign" : "summary";
}

function markVisited(visited: WizardStep[], step: WizardStep): WizardStep[] {
  return visited.includes(step) ? visited : [...visited, step];
}

export const useReceiptStore = create<ReceiptState>()(
  persist(
    (set) => ({
      ...initialData,

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
      setPersonPhone: (id, phone) =>
        set((s) => ({ people: s.people.map((p) => (p.id === id ? { ...p, phone } : p)) })),
      setPersonCountry: (id, phoneCountry) =>
        set((s) => ({ people: s.people.map((p) => (p.id === id ? { ...p, phoneCountry } : p)) })),

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
      setCurrency: (currency) => set({ currency, currencyAutoDetected: false }),
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
          let target: WizardStep;
          if (s.step === "mode") target = nextAfterMode(s.splitMode);
          else if (s.step === "assign") target = "summary";
          else {
            const i = stepOrder.indexOf(s.step);
            target = stepOrder[Math.min(i + 1, stepOrder.length - 1)];
          }
          return { step: target, visitedSteps: markVisited(s.visitedSteps, target) };
        }),
      prevStep: () =>
        set((s) => {
          let target: WizardStep;
          if (s.step === "summary") target = nextAfterMode(s.splitMode) === "assign" ? "assign" : "mode";
          else if (s.step === "assign") target = "mode";
          else {
            const i = stepOrder.indexOf(s.step);
            target = stepOrder[Math.max(i - 1, 0)];
          }
          return { step: target, visitedSteps: markVisited(s.visitedSteps, target) };
        }),
      goToStep: (step) =>
        set((s) => ({ step, visitedSteps: markVisited(s.visitedSteps, step) })),
      applyDetectedRegion: (region) =>
        set((s) => ({
          detectedRegion: region,
          currency: s.currencyAutoDetected ? currencyForRegion(region) : s.currency,
        })),
      resetAll: () => set(initialData),
    }),
    { name: "split-bill-receipt", storage: createExpiringStorage(ONE_DAY_MS) },
  ),
);

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

const advanceBlockedReasons: Record<Exclude<WizardStep, "summary">, string> = {
  people: "Add at least two people with valid, non-duplicate names.",
  items: "Add at least one valid item, and make sure tax and service amounts are valid.",
  mode: "Choose how to split the bill.",
  assign: "Assign every item to at least one person.",
};

export function getAdvanceBlockedReason(step: WizardStep, state: ReceiptState): string | null {
  if (canAdvance(step, state) || step === "summary") return null;
  return advanceBlockedReasons[step];
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
