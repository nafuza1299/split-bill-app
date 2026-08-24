import { describe, expect, it } from "vitest";
import { parseDollarsToCents } from "./money";
import {
  calculateSplit,
  itemTotalCents,
  personItemShareCents,
  type ItemAssignments,
  type Person,
  type ReceiptItem,
} from "./splitCalculator";

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

  it("splits tax and service evenly across everyone", () => {
    const items = [item("i1", "Thing", 1, 3000)];
    const result = calculateSplit({
      people,
      items,
      taxCents: 300,
      serviceCents: 150,
      mode: "even",
      assignments: {},
    });
    for (const p of people) {
      expect(result.personTaxCents[p.id]).toBe(100);
      expect(result.personServiceCents[p.id]).toBe(50);
    }
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

describe("calculateSplit — assign mode edge cases", () => {
  const people = [person("p1", "A"), person("p2", "B")];

  it("skips an item that has no entry in the assignments map at all", () => {
    const items = [item("i1", "Unassigned", 1, 500)];
    const result = calculateSplit({
      people,
      items,
      taxCents: 0,
      serviceCents: 0,
      mode: "assign",
      assignments: {},
    });
    expect(result.itemSubtotalCents).toBe(500);
    expect(result.personTotals.p1).toBe(0);
    expect(result.personTotals.p2).toBe(0);
  });

  it("falls back the tax/service ratio to 0 when itemSubtotalCents is 0", () => {
    const items = [item("i1", "Free sample", 1, 0)];
    const assignments: ItemAssignments = { i1: ["p1"] };
    const result = calculateSplit({
      people,
      items,
      taxCents: 100,
      serviceCents: 0,
      mode: "assign",
      assignments,
    });
    expect(result.itemSubtotalCents).toBe(0);
    expect(sumTotals(result.personTotals)).toBe(result.grandTotalCents);
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
    expect(result.personTaxCents.p1).toBe(150);
    expect(result.personTaxCents.p2).toBe(100);
  });

  it("splits tax and service proportionally to each person's item subtotal", () => {
    const items = [item("shared", "Pizza", 1, 2000), item("solo", "Coffee", 1, 500)];
    const assignments: ItemAssignments = { shared: ["p1", "p2"], solo: ["p1"] };
    const result = calculateSplit({
      people,
      items,
      taxCents: 250,
      serviceCents: 100,
      mode: "assign",
      assignments,
    });
    // p1 is 60% of item subtotal, p2 is 40%.
    expect(result.personTaxCents.p1).toBeCloseTo(150, 5);
    expect(result.personTaxCents.p2).toBeCloseTo(100, 5);
    expect(result.personServiceCents.p1).toBeCloseTo(60, 5);
    expect(result.personServiceCents.p2).toBeCloseTo(40, 5);
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

describe("personItemShareCents", () => {
  it("divides the item total across the assignees, not the full price", () => {
    const pizza = item("i1", "Pizza", 1, 2000);
    expect(personItemShareCents(pizza, 2)).toBe(1000);
  });

  it("returns the full item total when split among just one person", () => {
    const coffee = item("i2", "Coffee", 1, 500);
    expect(personItemShareCents(coffee, 1)).toBe(500);
  });

  it("returns 0 when split among nobody, without dividing by zero", () => {
    const coffee = item("i2", "Coffee", 1, 500);
    expect(personItemShareCents(coffee, 0)).toBe(0);
  });

  it("matches itemTotalCents when split among one person", () => {
    const snacks = item("i3", "Snacks", 3, 333);
    expect(personItemShareCents(snacks, 1)).toBe(itemTotalCents(snacks));
  });
});
