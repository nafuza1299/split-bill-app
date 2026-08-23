export function parseDollarsToCents(input: string): number {
  const n = Number(input);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function formatCentsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}
