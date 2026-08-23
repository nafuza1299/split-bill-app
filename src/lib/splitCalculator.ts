export interface Person {
  id: string;
  name: string;
}

export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
}

export type SplitMode = "even" | "assign";

export type ItemAssignments = Record<string, string[]>;

export interface SplitInput {
  people: Person[];
  items: ReceiptItem[];
  taxCents: number;
  serviceCents: number;
  mode: SplitMode;
  assignments: ItemAssignments;
}

export interface SplitResult {
  personTotals: Record<string, number>;
  itemSubtotalCents: number;
  grandTotalCents: number;
}

function itemTotalCents(item: ReceiptItem): number {
  return Math.round(item.quantity * item.unitPriceCents);
}

export function calculateSplit(input: SplitInput): SplitResult {
  const { people, items, taxCents, serviceCents, mode, assignments } = input;
  const itemSubtotalCents = items.reduce((sum, item) => sum + itemTotalCents(item), 0);
  const grandTotalCents = itemSubtotalCents + taxCents + serviceCents;

  if (people.length === 0) {
    return { personTotals: {}, itemSubtotalCents, grandTotalCents };
  }

  const rawShare: Record<string, number> = {};

  if (mode === "even") {
    const share = grandTotalCents / people.length;
    for (const person of people) rawShare[person.id] = share;
  } else {
    const itemSubtotalPerPerson: Record<string, number> = {};
    for (const person of people) itemSubtotalPerPerson[person.id] = 0;

    for (const item of items) {
      const assignees = assignments[item.id] ?? [];
      if (assignees.length === 0) continue;
      const share = itemTotalCents(item) / assignees.length;
      for (const personId of assignees) {
        itemSubtotalPerPerson[personId] = (itemSubtotalPerPerson[personId] ?? 0) + share;
      }
    }

    const extra = taxCents + serviceCents;
    for (const person of people) {
      const personSubtotal = itemSubtotalPerPerson[person.id] ?? 0;
      const extraShare = itemSubtotalCents > 0 ? (personSubtotal / itemSubtotalCents) * extra : 0;
      rawShare[person.id] = personSubtotal + extraShare;
    }
  }

  // Largest-remainder (Hamilton's) rounding: floor every share, then hand the
  // leftover cents to whoever has the largest fractional remainder, so
  // personTotals always sums exactly to grandTotalCents.
  const floors = people.map((p) => Math.floor(rawShare[p.id]));
  const sumFloors = floors.reduce((a, b) => a + b, 0);
  const remaining = grandTotalCents - sumFloors;

  const order = people
    .map((p, i) => ({ id: p.id, remainder: rawShare[p.id] - floors[i] }))
    .sort((a, b) => b.remainder - a.remainder);

  const personTotals: Record<string, number> = {};
  people.forEach((p, i) => {
    personTotals[p.id] = floors[i];
  });
  // Modulo guards the degenerate case (e.g. all item prices are 0 but tax is
  // set) where `remaining` cents exceed the number of people with a nonzero
  // remainder — cycles the leftover cents round-robin instead of throwing.
  for (let i = 0; i < remaining; i++) {
    personTotals[order[i % order.length].id] += 1;
  }

  return { personTotals, itemSubtotalCents, grandTotalCents };
}
