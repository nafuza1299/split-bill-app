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
