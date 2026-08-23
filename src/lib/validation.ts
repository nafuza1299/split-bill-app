import { z } from "zod";
import type { ReceiptItem } from "./splitCalculator";

const WILDCARD_PATTERN = /[*?%_]/;
const WILDCARD_MESSAGE = "No * ? % _ allowed";

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .refine((v) => !WILDCARD_PATTERN.test(v), WILDCARD_MESSAGE);

export const quantitySchema = z.number().int("Must be a whole number").positive("Must be at least 1");

export const centsSchema = z.number().nonnegative("Must be zero or more");

function firstError(result: { success: boolean; error?: { issues: { message: string }[] } }): string | null {
  return result.success ? null : (result.error?.issues[0].message ?? null);
}

export function getNameError(name: string): string | null {
  return firstError(nameSchema.safeParse(name));
}

export function getQuantityError(quantity: number): string | null {
  return firstError(quantitySchema.safeParse(quantity));
}

export function getMoneyError(cents: number): string | null {
  return firstError(centsSchema.safeParse(cents));
}

export interface ItemFieldErrors {
  name: string | null;
  quantity: string | null;
  unitPrice: string | null;
}

export function getItemFieldErrors(item: ReceiptItem): ItemFieldErrors {
  return {
    name: getNameError(item.name),
    quantity: getQuantityError(item.quantity),
    unitPrice: getMoneyError(item.unitPriceCents),
  };
}

export function isItemValid(item: ReceiptItem): boolean {
  const errors = getItemFieldErrors(item);
  return !errors.name && !errors.quantity && !errors.unitPrice;
}

export const DUPLICATE_NAME_MESSAGE = "This name is already used";

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export function isNameTaken(name: string, otherNames: string[]): boolean {
  const key = normalizeName(name);
  if (!key) return false;
  return otherNames.some((other) => normalizeName(other) === key);
}

// Indices of every name that shares its (trimmed, case-insensitive) value with
// another name in the list — both the original and the later duplicate(s).
export function getDuplicateNameIndices(names: string[]): Set<number> {
  const firstSeenAt = new Map<string, number>();
  const duplicates = new Set<number>();
  names.forEach((name, index) => {
    const key = normalizeName(name);
    if (!key) return;
    const earlierIndex = firstSeenAt.get(key);
    if (earlierIndex !== undefined) {
      duplicates.add(earlierIndex);
      duplicates.add(index);
    } else {
      firstSeenAt.set(key, index);
    }
  });
  return duplicates;
}
