import { formatMoney } from "./money";
import type { ReceiptItem } from "./splitCalculator";

export interface PersonBreakdown {
  name: string;
  totalCents: number;
  itemNames: string[];
}

export interface ReceiptTextInput {
  receiptName: string;
  dateLabel: string;
  items: ReceiptItem[];
  taxCents: number;
  serviceCents: number;
  itemSubtotalCents: number;
  grandTotalCents: number;
  people: PersonBreakdown[];
}

export function formatReceiptText(input: ReceiptTextInput): string {
  const lines: string[] = [input.receiptName || "Receipt"];
  if (input.dateLabel) lines.push(input.dateLabel);
  lines.push("");

  for (const item of input.items) {
    const lineTotal = formatMoney(item.quantity * item.unitPriceCents);
    lines.push(`${item.name || "Untitled item"} × ${item.quantity} — $${lineTotal}`);
  }

  lines.push(
    "",
    `Subtotal: $${formatMoney(input.itemSubtotalCents)}`,
    `Tax: $${formatMoney(input.taxCents)}`,
    `Service charge: $${formatMoney(input.serviceCents)}`,
    `Total: $${formatMoney(input.grandTotalCents)}`,
    "",
    "Split:",
  );

  for (const person of input.people) {
    const suffix = person.itemNames.length > 0 ? ` (${person.itemNames.join(", ")})` : "";
    lines.push(`${person.name} — $${formatMoney(person.totalCents)}${suffix}`);
  }

  return lines.join("\n");
}

export function sanitizeFilename(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return cleaned || "receipt";
}
