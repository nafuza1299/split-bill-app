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
