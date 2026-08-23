import { describe, expect, it } from "vitest";
import { parseDollarsToCents } from "./money";
import { calculateSplit, type ItemAssignments, type Person, type ReceiptItem } from "./splitCalculator";

const person = (id: string, name: string): Person => ({ id, name });
const item = (id: string, name: string, quantity: number, unitPriceCents: number): ReceiptItem => ({
  id,
  name,
  quantity,
  unitPriceCents,
});

function sumTotals(personTotals: Record<string, number>): number {
  return Object.values(personTotals).reduce((a, b) => a + b, 0);
}

describe("parseDollarsToCents", () => {
  it("avoids float drift", () => {
    expect(parseDollarsToCents("19.99")).toBe(1999);
  });
});

describe("calculateSplit — even mode", () => {
  const people = [person("p1", "A"), person("p2", "B"), person("p3", "C")];

  it("splits an evenly-divisible total exactly", () => {
    const items = [item("i1", "Thing", 1, 3000)];
    const result = calculateSplit({
      people,
      items,
      taxCents: 0,
      serviceCents: 0,
      mode: "even",
      assignments: {},
    });
    expect(result.grandTotalCents).toBe(3000);
    for (const p of people) expect(result.personTotals[p.id]).toBe(1000);
  });

  it("distributes remainder cents without losing or duplicating any", () => {
    const items = [item("i1", "Thing", 1, 1000)];
    const result = calculateSplit({
      people,
      items,
      taxCents: 0,
      serviceCents: 0,
      mode: "even",
      assignments: {},
    });
    expect(sumTotals(result.personTotals)).toBe(1000);
    const values = Object.values(result.personTotals).sort((a, b) => a - b);
    expect(values).toEqual([333, 333, 334]);
  });
});

describe("calculateSplit — assign mode", () => {
  const people = [person("p1", "A"), person("p2", "B")];

  it("splits shared items evenly and solo items fully, allocating tax/service proportionally", () => {
    const items = [item("shared", "Pizza", 1, 2000), item("solo", "Coffee", 1, 500)];
    const assignments: ItemAssignments = {
      shared: ["p1", "p2"],
      solo: ["p1"],
    };
    const result = calculateSplit({
      people,
      items,
      taxCents: 250,
      serviceCents: 0,
      mode: "assign",
      assignments,
    });

    // itemSubtotal = 2500; p1 owes 1000(shared) + 500(solo) = 1500 (60%),
    // p2 owes 1000 (40%). tax 250 split 60/40 -> 150 / 100.
    expect(result.itemSubtotalCents).toBe(2500);
    expect(result.grandTotalCents).toBe(2750);
    expect(result.personTotals.p1).toBe(1650);
    expect(result.personTotals.p2).toBe(1100);
    expect(sumTotals(result.personTotals)).toBe(result.grandTotalCents);
  });

  it("sums exactly to the grand total even with an odd, non-divisible total", () => {
    const items = [item("shared", "Snacks", 1, 999)];
    const assignments: ItemAssignments = { shared: ["p1", "p2"] };
    const result = calculateSplit({
      people,
      items,
      taxCents: 77,
      serviceCents: 33,
      mode: "assign",
      assignments,
    });
    expect(sumTotals(result.personTotals)).toBe(result.grandTotalCents);
  });
});
