import type { ReceiptTextInput } from "./receiptText";
import { itemsForPerson } from "./splitCalculator";
import type { SplitResult } from "./splitCalculator";
import type { ReceiptState } from "../store/useReceiptStore";

export type ReceiptSnapshot = Pick<
  ReceiptState,
  | "step"
  | "receiptName"
  | "receiptDate"
  | "people"
  | "items"
  | "taxCents"
  | "serviceCents"
  | "currency"
  | "splitMode"
  | "assignments"
  | "visitedSteps"
  | "detectedRegion"
  | "currencyAutoDetected"
>;

const snapshotKeys = [
  "step",
  "receiptName",
  "receiptDate",
  "people",
  "items",
  "taxCents",
  "serviceCents",
  "currency",
  "splitMode",
  "assignments",
  "visitedSteps",
  "detectedRegion",
  "currencyAutoDetected",
] as const satisfies readonly (keyof ReceiptSnapshot)[];

export function snapshotFromReceiptState(state: ReceiptState): ReceiptSnapshot {
  const snapshot = {} as ReceiptSnapshot;
  for (const key of snapshotKeys) (snapshot[key] as unknown) = state[key];
  return snapshot;
}

export function hasContent(snapshot: Pick<ReceiptSnapshot, "people" | "items">): boolean {
  return snapshot.people.length > 0 || snapshot.items.length > 0;
}

export function entryTitle(snapshot: Pick<ReceiptSnapshot, "receiptName">): string {
  return snapshot.receiptName.trim() || "Untitled split";
}

/** Builds the shared text/spreadsheet export input from a saved entry's data (no live store needed). */
export function receiptTextInputFromSnapshot(snapshot: ReceiptSnapshot, result: SplitResult): ReceiptTextInput {
  return {
    receiptName: snapshot.receiptName,
    dateLabel: snapshot.receiptDate ? new Date(snapshot.receiptDate).toLocaleDateString() : "",
    items: snapshot.items,
    taxCents: snapshot.taxCents,
    serviceCents: snapshot.serviceCents,
    itemSubtotalCents: result.itemSubtotalCents,
    grandTotalCents: result.grandTotalCents,
    currency: snapshot.currency,
    people: snapshot.people.map((person) => ({
      name: person.name,
      totalCents: result.personTotals[person.id] ?? 0,
      itemNames: itemsForPerson(person.id, snapshot.items, snapshot.splitMode, snapshot.assignments).map(
        (item) => item.name || "Untitled item",
      ),
    })),
  };
}
