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
  currency: string;
  people: PersonBreakdown[];
}

export function formatReceiptText(input: ReceiptTextInput): string {
  const lines: string[] = [input.receiptName || "Receipt"];
  if (input.dateLabel) lines.push(input.dateLabel);
  lines.push("");

  for (const item of input.items) {
    const lineTotal = formatMoney(item.quantity * item.unitPriceCents, input.currency);
    lines.push(`${item.name || "Untitled item"} × ${item.quantity} — ${lineTotal}`);
  }

  lines.push(
    "",
    `Subtotal: ${formatMoney(input.itemSubtotalCents, input.currency)}`,
    `Tax: ${formatMoney(input.taxCents, input.currency)}`,
    `Service charge: ${formatMoney(input.serviceCents, input.currency)}`,
    `Total: ${formatMoney(input.grandTotalCents, input.currency)}`,
    "",
    "Split:",
  );

  for (const person of input.people) {
    const suffix = person.itemNames.length > 0 ? ` (${person.itemNames.join(", ")})` : "";
    lines.push(`${person.name} — ${formatMoney(person.totalCents, input.currency)}${suffix}`);
  }

  return lines.join("\n");
}

export interface PersonShareTextInput {
  receiptName: string;
  dateLabel: string;
  personName: string;
  items: { name: string; shareCents: number }[];
  taxCents: number;
  serviceCents: number;
  totalCents: number;
  currency: string;
}

export function formatPersonShareText(input: PersonShareTextInput): string {
  const lines: string[] = [input.receiptName || "Receipt"];
  if (input.dateLabel) lines.push(input.dateLabel);
  lines.push("", input.personName);

  for (const item of input.items) {
    lines.push(`${item.name} — ${formatMoney(item.shareCents, input.currency)}`);
  }

  lines.push(
    "",
    `Tax: ${formatMoney(input.taxCents, input.currency)}`,
    `Service charge: ${formatMoney(input.serviceCents, input.currency)}`,
    `Total: ${formatMoney(input.totalCents, input.currency)}`,
  );

  return lines.join("\n");
}

export function buildReceiptRows(input: ReceiptTextInput): (string | number)[][] {
  const rows: (string | number)[][] = [[input.receiptName || "Receipt"]];
  if (input.dateLabel) rows.push([input.dateLabel]);
  rows.push([]);

  rows.push(["Item", "Qty", "Unit Price", "Line Total"]);
  for (const item of input.items) {
    rows.push([
      item.name || "Untitled item",
      item.quantity,
      formatMoney(item.unitPriceCents, input.currency),
      formatMoney(item.quantity * item.unitPriceCents, input.currency),
    ]);
  }

  rows.push(
    [],
    ["Subtotal", formatMoney(input.itemSubtotalCents, input.currency)],
    ["Tax", formatMoney(input.taxCents, input.currency)],
    ["Service charge", formatMoney(input.serviceCents, input.currency)],
    ["Total", formatMoney(input.grandTotalCents, input.currency)],
    [],
    ["Split"],
    ["Name", "Total", "Items"],
  );
  for (const person of input.people) {
    rows.push([person.name, formatMoney(person.totalCents, input.currency), person.itemNames.join(", ")]);
  }

  return rows;
}

export function sanitizeFilename(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return cleaned || "receipt";
}
