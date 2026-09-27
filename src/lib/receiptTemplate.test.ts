import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { buildTemplateWorkbook, parseTemplateWorkbook, type TemplateExportInput } from "./receiptTemplate";

const evenInput: TemplateExportInput = {
  receiptName: "Joe's Diner",
  receiptDate: "2026-08-23",
  currency: "USD",
  splitMode: "even",
  taxCents: 250,
  serviceCents: 100,
  people: [
    { id: "p1", name: "Alice", phoneCountry: "US", phone: "5551234" },
    { id: "p2", name: "Bob" },
  ],
  items: [
    { id: "i1", name: "Pizza", quantity: 2, unitPriceCents: 1000 },
    { id: "i2", name: "Coffee", quantity: 1, unitPriceCents: 500 },
  ],
  assignments: {},
};

const assignInput: TemplateExportInput = {
  ...evenInput,
  splitMode: "assign",
  assignments: { i1: ["p1"], i2: ["p1", "p2"] },
};

describe("buildTemplateWorkbook", () => {
  it("writes Settings with the receipt's name, date, currency, mode, and money as plain numbers", () => {
    const wb = buildTemplateWorkbook(evenInput);
    const settings = wb.getWorksheet("Settings")!;
    expect(settings.getRow(2).getCell(2).value).toBe("Joe's Diner");
    expect(settings.getRow(3).getCell(2).value).toBe("2026-08-23");
    expect(settings.getRow(4).getCell(2).value).toBe("USD");
    expect(settings.getRow(5).getCell(2).value).toBe("even");
    expect(settings.getRow(6).getCell(2).value).toBe(2.5);
    expect(settings.getRow(7).getCell(2).value).toBe(1);
  });

  it("writes one People row per person, blank for unset phone fields", () => {
    const wb = buildTemplateWorkbook(evenInput);
    const people = wb.getWorksheet("People")!;
    expect(people.getRow(2).values).toEqual([undefined, "Alice", "US", "5551234"]);
    expect(people.getRow(3).getCell(1).value).toBe("Bob");
    expect(people.getRow(3).getCell(2).value).toBe("");
  });

  it("writes Item rows with a live Line Total formula, and a formula-based summary block", () => {
    const wb = buildTemplateWorkbook(evenInput);
    const items = wb.getWorksheet("Items")!;
    expect(items.getRow(2).getCell(1).value).toBe("Pizza");
    expect(items.getRow(2).getCell(2).value).toBe(2);
    expect(items.getRow(2).getCell(3).value).toBe(10);
    expect(items.getRow(2).getCell(4).value).toEqual({ formula: "B2*C2" });
    expect(items.getRow(3).getCell(4).value).toEqual({ formula: "B3*C3" });

    // blank separator at row 4, summary starts row 5
    expect(items.getRow(5).getCell(1).value).toBe("Subtotal");
    expect(items.getRow(5).getCell(2).value).toEqual({ formula: "SUM(D2:D3)" });
    expect(items.getRow(6).getCell(2).value).toEqual({ formula: "Settings!B6" });
    expect(items.getRow(7).getCell(2).value).toEqual({ formula: "Settings!B7" });
    expect(items.getRow(8).getCell(1).value).toBe("Grand Total");
    expect(items.getRow(8).getCell(2).value).toEqual({ formula: "B5+B6+B7" });
  });

  it("omits the Assignments sheet in even mode", () => {
    const wb = buildTemplateWorkbook(evenInput);
    expect(wb.getWorksheet("Assignments")).toBeUndefined();
  });

  it("writes an Assignments matrix in assign mode, 1 for assigned, blank otherwise", () => {
    const wb = buildTemplateWorkbook(assignInput);
    const assignments = wb.getWorksheet("Assignments")!;
    expect(assignments.getRow(1).values).toEqual([undefined, "Item \\ Person", "Alice", "Bob"]);
    expect(assignments.getRow(2).getCell(2).value).toBe(1); // Pizza -> Alice
    expect(assignments.getRow(2).getCell(3).value).toBe(""); // Pizza -> Bob
    expect(assignments.getRow(3).getCell(2).value).toBe(1); // Coffee -> Alice
    expect(assignments.getRow(3).getCell(3).value).toBe(1); // Coffee -> Bob
  });

  it("doesn't crash with zero items", () => {
    const wb = buildTemplateWorkbook({ ...evenInput, items: [] });
    const items = wb.getWorksheet("Items")!;
    expect(items.getRow(3).getCell(1).value).toBe("Subtotal");
  });
});

async function roundTrip(input: TemplateExportInput) {
  const written = buildTemplateWorkbook(input);
  const buffer = await written.xlsx.writeBuffer();
  const read = new ExcelJS.Workbook();
  await read.xlsx.load(buffer as unknown as ArrayBuffer);
  return parseTemplateWorkbook(read);
}

describe("parseTemplateWorkbook", () => {
  it("round-trips the receipt's settings", async () => {
    const snapshot = await roundTrip(evenInput);
    expect(snapshot.receiptName).toBe("Joe's Diner");
    expect(snapshot.receiptDate).toBe("2026-08-23");
    expect(snapshot.currency).toBe("USD");
    expect(snapshot.splitMode).toBe("even");
    expect(snapshot.taxCents).toBe(250);
    expect(snapshot.serviceCents).toBe(100);
  });

  it("round-trips people with fresh ids, keeping phone fields only when set", async () => {
    const snapshot = await roundTrip(evenInput);
    expect(snapshot.people).toHaveLength(2);
    expect(snapshot.people[0]).toMatchObject({ name: "Alice", phoneCountry: "US", phone: "5551234" });
    expect(snapshot.people[0].id).not.toBe("p1");
    expect(snapshot.people[1]).toEqual({ id: snapshot.people[1].id, name: "Bob" });
  });

  it("round-trips items with fresh ids", async () => {
    const snapshot = await roundTrip(evenInput);
    expect(snapshot.items).toHaveLength(2);
    expect(snapshot.items[0]).toMatchObject({ name: "Pizza", quantity: 2, unitPriceCents: 1000 });
    expect(snapshot.items[1]).toMatchObject({ name: "Coffee", quantity: 1, unitPriceCents: 500 });
  });

  it("round-trips assignments by matching the new person/item ids to the matrix positions", async () => {
    const snapshot = await roundTrip(assignInput);
    const alice = snapshot.people.find((p) => p.name === "Alice")!;
    const bob = snapshot.people.find((p) => p.name === "Bob")!;
    const pizza = snapshot.items.find((i) => i.name === "Pizza")!;
    const coffee = snapshot.items.find((i) => i.name === "Coffee")!;
    expect(snapshot.assignments[pizza.id]).toEqual([alice.id]);
    expect(snapshot.assignments[coffee.id].sort()).toEqual([alice.id, bob.id].sort());
  });

  it("defaults step/visitedSteps/currencyAutoDetected for a freshly-imported entry", async () => {
    const snapshot = await roundTrip(evenInput);
    expect(snapshot.step).toBe("people");
    expect(snapshot.visitedSteps).toEqual(["people"]);
    expect(snapshot.currencyAutoDetected).toBe(false);
  });

  it("throws a descriptive error when the expected sheets are missing", () => {
    const wb = new ExcelJS.Workbook();
    wb.addWorksheet("Nonsense");
    expect(() => parseTemplateWorkbook(wb)).toThrow(/doesn't look like a Split Bill/);
  });
});
