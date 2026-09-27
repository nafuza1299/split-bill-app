import ExcelJS from "exceljs";
import type { ReceiptSnapshot } from "./entries";
import { detectRegion } from "./locale";
import { parseDollarsToCents } from "./money";
import type { ItemAssignments, Person, ReceiptItem, SplitMode } from "./splitCalculator";

// Fixed Settings-sheet rows, referenced cross-sheet by the Items sheet's
// Tax/Service formulas — keep buildTemplateWorkbook and parseTemplateWorkbook
// in sync if these ever move.
const SETTINGS_ROWS = {
  receiptName: 2,
  receiptDate: 3,
  currency: 4,
  splitMode: 5,
  tax: 6,
  serviceCharge: 7,
} as const;

export type TemplateExportInput = Pick<
  ReceiptSnapshot,
  | "receiptName"
  | "receiptDate"
  | "currency"
  | "splitMode"
  | "taxCents"
  | "serviceCents"
  | "people"
  | "items"
  | "assignments"
>;

/** Builds the shared export/import workbook: Settings, People, Items (with live formulas), and — in assign mode — an Assignments matrix. */
export function buildTemplateWorkbook(snapshot: TemplateExportInput): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();

  const settings = workbook.addWorksheet("Settings");
  settings.addRow(["Field", "Value"]);
  settings.addRow(["Receipt name", snapshot.receiptName]);
  settings.addRow(["Date", snapshot.receiptDate]);
  settings.addRow(["Currency", snapshot.currency]);
  settings.addRow(["Split mode", snapshot.splitMode ?? "even"]);
  settings.addRow(["Tax", snapshot.taxCents / 100]);
  settings.addRow(["Service charge", snapshot.serviceCents / 100]);

  const people = workbook.addWorksheet("People");
  people.addRow(["Name", "Phone Country", "Phone"]);
  for (const person of snapshot.people) {
    people.addRow([person.name, person.phoneCountry ?? "", person.phone ?? ""]);
  }

  const items = workbook.addWorksheet("Items");
  items.addRow(["Item", "Quantity", "Unit Price", "Line Total"]);
  snapshot.items.forEach((item, i) => {
    const row = i + 2;
    items.addRow([item.name, item.quantity, item.unitPriceCents / 100, { formula: `B${row}*C${row}` }]);
  });
  const lastItemRow = Math.max(2, snapshot.items.length + 1);
  items.addRow([]);
  const subtotalRow = lastItemRow + 2;
  items.addRow(["Subtotal", { formula: `SUM(D2:D${lastItemRow})` }]);
  const taxRow = subtotalRow + 1;
  items.addRow(["Tax", { formula: `Settings!B${SETTINGS_ROWS.tax}` }]);
  const serviceRow = taxRow + 1;
  items.addRow(["Service charge", { formula: `Settings!B${SETTINGS_ROWS.serviceCharge}` }]);
  items.addRow(["Grand Total", { formula: `B${subtotalRow}+B${taxRow}+B${serviceRow}` }]);

  if (snapshot.splitMode === "assign") {
    const assignments = workbook.addWorksheet("Assignments");
    assignments.addRow(["Item \\ Person", ...snapshot.people.map((p) => p.name)]);
    for (const item of snapshot.items) {
      const assigned = new Set(snapshot.assignments[item.id] ?? []);
      assignments.addRow([item.name, ...snapshot.people.map((p) => (assigned.has(p.id) ? 1 : ""))]);
    }
  }

  return workbook;
}

function cellText(sheet: ExcelJS.Worksheet, row: number, col: number): string {
  const value = sheet.getRow(row).getCell(col).value;
  return value == null ? "" : String(value).trim();
}

/** Reconstructs a full ReceiptSnapshot from a template workbook (fresh IDs for every person/item). Throws if the expected sheets aren't present. */
export function parseTemplateWorkbook(workbook: ExcelJS.Workbook): ReceiptSnapshot {
  const settingsSheet = workbook.getWorksheet("Settings");
  const peopleSheet = workbook.getWorksheet("People");
  const itemsSheet = workbook.getWorksheet("Items");
  if (!settingsSheet || !peopleSheet || !itemsSheet) {
    throw new Error("This doesn't look like a Split Bill Excel file — missing the Settings, People, or Items sheet.");
  }

  const receiptName = cellText(settingsSheet, SETTINGS_ROWS.receiptName, 2);
  const receiptDate = cellText(settingsSheet, SETTINGS_ROWS.receiptDate, 2);
  const currency = cellText(settingsSheet, SETTINGS_ROWS.currency, 2) || "USD";
  const splitMode: SplitMode = cellText(settingsSheet, SETTINGS_ROWS.splitMode, 2) === "assign" ? "assign" : "even";
  const taxCents = parseDollarsToCents(cellText(settingsSheet, SETTINGS_ROWS.tax, 2));
  const serviceCents = parseDollarsToCents(cellText(settingsSheet, SETTINGS_ROWS.serviceCharge, 2));

  const people: Person[] = [];
  for (let row = 2; row <= peopleSheet.rowCount; row++) {
    const name = cellText(peopleSheet, row, 1);
    if (!name) break;
    const phoneCountry = cellText(peopleSheet, row, 2);
    const phone = cellText(peopleSheet, row, 3);
    people.push({
      id: crypto.randomUUID(),
      name,
      ...(phoneCountry ? { phoneCountry } : {}),
      ...(phone ? { phone } : {}),
    });
  }

  const items: ReceiptItem[] = [];
  for (let row = 2; row <= itemsSheet.rowCount; row++) {
    const name = cellText(itemsSheet, row, 1);
    if (!name) break;
    const quantity = Number(cellText(itemsSheet, row, 2)) || 0;
    const unitPriceCents = parseDollarsToCents(cellText(itemsSheet, row, 3));
    items.push({ id: crypto.randomUUID(), name, quantity, unitPriceCents });
  }

  const assignments: ItemAssignments = {};
  if (splitMode === "assign") {
    const assignmentsSheet = workbook.getWorksheet("Assignments");
    if (assignmentsSheet) {
      items.forEach((item, i) => {
        const row = i + 2;
        const assignedIds = people
          .filter((_, j) => {
            const cell = cellText(assignmentsSheet, row, j + 2);
            return cell !== "" && cell !== "0";
          })
          .map((p) => p.id);
        assignments[item.id] = assignedIds;
      });
    }
  }

  return {
    step: "people",
    receiptName,
    receiptDate,
    people,
    items,
    taxCents,
    serviceCents,
    currency,
    splitMode,
    assignments,
    visitedSteps: ["people"],
    detectedRegion: detectRegion(),
    currencyAutoDetected: false,
  };
}
