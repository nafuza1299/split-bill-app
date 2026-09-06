import type { ReceiptItem } from "./splitCalculator";

// Decimal-cents style, e.g. "4.50" or "1,234.56".
const TRAILING_PRICE_CENTS = /(\d[\d,]*\.\d{2})\s*$/;
// Dot-grouped thousands style with no decimal fraction, e.g. "79.000" or "1.234.000"
// (common outside the US, where "." groups thousands instead of marking cents).
const TRAILING_PRICE_THOUSANDS = /(\d{1,3}(?:\.\d{3})+)\s*$/;
const QTY_PREFIX = /^(\d{1,2})\s*[xX]\s+/;
// A quantity in its own leading column, e.g. "2 Cheese Omurice". OCR output
// commonly collapses the wide visual gap of a real receipt's quantity column
// down to a single space, so this can't require multiple spaces — the
// tradeoff is a rare false positive on an item name that starts with a
// number (e.g. "7 Up"), left for the user to fix like any other misparse.
const QTY_COLUMN = /^(\d{1,2})\s+/;
const DOT_LEADERS = /[.\s]{2,}$/;
const NON_ITEM_NAME =
  /^(grand\s*)?(sub\s*)?total$|^tax$|^change$|^cash$|^balance( due)?$|^tip$|^discount$|^service\s*charge$|^pb\d$/i;

// ponytail: naive per-line heuristic tuned for the common POS receipt layout
// "ItemName .... 12.99" or "2x ItemName 12.99" (plus a dot-grouped-thousands
// price variant and a leading-quantity-column variant for non-US receipts).
// Misparses receipts that print qty/unit-price/line-total as separate columns
// beyond what's handled here, and multi-line item names. Good enough to
// prefill the form — every row still goes through the same field validators
// as manual entry, and the user can edit/delete before advancing. Upgrade to
// a column-aware parser (split on runs of 2+ spaces) if more formats show up.
export function parseReceiptText(rawText: string): Omit<ReceiptItem, "id">[] {
  const items: Omit<ReceiptItem, "id">[] = [];

  for (const rawLine of rawText.split("\n")) {
    const line = rawLine.trim();

    const centsMatch = line.match(TRAILING_PRICE_CENTS);
    const thousandsMatch = centsMatch ? null : line.match(TRAILING_PRICE_THOUSANDS);
    const priceMatch = centsMatch ?? thousandsMatch;
    if (!priceMatch) continue;

    const unitPriceCents = centsMatch
      ? Math.round(parseFloat(centsMatch[1].replace(/,/g, "")) * 100)
      : Math.round(Number(thousandsMatch![1].replace(/\./g, "")) * 100);
    if (unitPriceCents <= 0) continue;

    let rest = line.slice(0, priceMatch.index).trim();
    let quantity = 1;
    const qtyMatch = rest.match(QTY_PREFIX) ?? rest.match(QTY_COLUMN);
    if (qtyMatch) {
      quantity = Number(qtyMatch[1]);
      rest = rest.slice(qtyMatch[0].length);
    }

    const name = rest.replace(DOT_LEADERS, "").trim();
    if (!name || NON_ITEM_NAME.test(name)) continue;

    items.push({ name, quantity, unitPriceCents });
  }

  return items;
}
