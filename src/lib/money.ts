export function parseDollarsToCents(input: string): number {
  const n = Number(input);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

// A number the user might still be in the middle of typing (e.g. "5." or "").
export function isPartialMoneyText(text: string): boolean {
  return /^\d*\.?\d*$/.test(text);
}

export function formatCentsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

// Read-only display formatting, e.g. "$1,234.56" — adds thousands separators
// on top of formatCentsToDollars for receipts/summaries.
export function formatMoney(cents: number): string {
  return formatWithThousandsSeparators(formatCentsToDollars(cents));
}

export function stripCommas(text: string): string {
  return text.replace(/,/g, "");
}

// Inserts thousands separators into the integer part of a comma-free money
// string (e.g. "1234.5" -> "1,234.5"). Leaves a trailing "." as-is so the
// user can keep typing decimals.
export function formatWithThousandsSeparators(raw: string): string {
  const dotIndex = raw.indexOf(".");
  const intPart = dotIndex === -1 ? raw : raw.slice(0, dotIndex);
  const decimalPart = dotIndex === -1 ? "" : raw.slice(dotIndex);
  const groupedIntPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return groupedIntPart + decimalPart;
}

// How many digits (ignoring commas/dots) appear before `index` in `text` —
// used to keep the cursor anchored to the same digit while commas shift.
export function countDigitsBefore(text: string, index: number): number {
  return (text.slice(0, index).match(/\d/g) ?? []).length;
}

// The character index in `text` that sits right after the Nth digit.
export function indexAfterDigits(text: string, digitCount: number): number {
  if (digitCount <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < text.length; i++) {
    if (/\d/.test(text[i])) {
      seen++;
      if (seen === digitCount) return i + 1;
    }
  }
  return text.length;
}
