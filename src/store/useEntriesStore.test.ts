import { describe, expect, it } from "vitest";
import { useEntriesStore } from "./useEntriesStore";
import { useReceiptStore } from "./useReceiptStore";
import { twoPeople } from "../test/fixtures";
import type { ReceiptSnapshot } from "../lib/entries";

const importedSnapshot: ReceiptSnapshot = {
  step: "people",
  receiptName: "Imported Dinner",
  receiptDate: "2026-03-05",
  people: twoPeople,
  items: [{ id: "i1", name: "Pizza", quantity: 1, unitPriceCents: 2000 }],
  taxCents: 100,
  serviceCents: 50,
  currency: "EUR",
  splitMode: "even",
  assignments: {},
  visitedSteps: ["people"],
  detectedRegion: "DE",
  currencyAutoDetected: false,
};

describe("importEntry", () => {
  it("hydrates the receipt store with the imported snapshot and switches to the wizard", () => {
    useEntriesStore.getState().importEntry(importedSnapshot);
    expect(useReceiptStore.getState().receiptName).toBe("Imported Dinner");
    expect(useReceiptStore.getState().people).toEqual(twoPeople);
    expect(useReceiptStore.getState().currency).toBe("EUR");
    expect(useEntriesStore.getState().view).toBe("wizard");
    expect(useEntriesStore.getState().activeEntryId).not.toBeNull();
  });

  it("assigns a fresh id distinct from any existing entry", () => {
    useEntriesStore.setState({ entries: [{ id: "existing", updatedAt: 1, snapshot: importedSnapshot }] });
    useEntriesStore.getState().importEntry(importedSnapshot);
    expect(useEntriesStore.getState().activeEntryId).not.toBe("existing");
  });

  it("appears in the saved entries list once the user backs out to Home", () => {
    useEntriesStore.getState().importEntry(importedSnapshot);
    useEntriesStore.getState().goHome();
    const saved = useEntriesStore.getState().entries.find((e) => e.snapshot.receiptName === "Imported Dinner");
    expect(saved).toBeDefined();
    expect(saved?.snapshot.people).toEqual(twoPeople);
  });
});

describe("openEntry", () => {
  it("hydrates the receipt store and switches to the wizard for a known entry", () => {
    useEntriesStore.setState({ entries: [{ id: "e1", updatedAt: 1, snapshot: importedSnapshot }] });
    useEntriesStore.getState().openEntry("e1");
    expect(useReceiptStore.getState().receiptName).toBe("Imported Dinner");
    expect(useEntriesStore.getState().activeEntryId).toBe("e1");
    expect(useEntriesStore.getState().view).toBe("wizard");
  });

  it("does nothing for an unknown id", () => {
    useEntriesStore.getState().openEntry("does-not-exist");
    expect(useEntriesStore.getState().view).toBe("home");
    expect(useEntriesStore.getState().activeEntryId).toBeNull();
  });
});

describe("createEntry", () => {
  it("resets the draft and switches to the wizard", () => {
    useReceiptStore.setState({ receiptName: "Stale" });
    useEntriesStore.getState().createEntry();
    expect(useReceiptStore.getState().receiptName).toBe("");
    expect(useEntriesStore.getState().view).toBe("wizard");
    expect(useEntriesStore.getState().activeEntryId).not.toBeNull();
  });

  it("applies the home region to the fresh draft when one is set", () => {
    useEntriesStore.setState({ homeRegion: "JP" });
    useEntriesStore.getState().createEntry();
    expect(useReceiptStore.getState().detectedRegion).toBe("JP");
    expect(useReceiptStore.getState().currency).toBe("JPY");
  });

  it("leaves the draft's detected region alone when no home region is set", () => {
    useEntriesStore.setState({ homeRegion: null });
    useReceiptStore.setState({ detectedRegion: "US" });
    useEntriesStore.getState().createEntry();
    expect(useReceiptStore.getState().detectedRegion).toBe("US");
  });
});

describe("goHome", () => {
  it("discards a fresh, empty draft instead of saving it", () => {
    useEntriesStore.getState().createEntry();
    useEntriesStore.getState().goHome();
    expect(useEntriesStore.getState().entries).toHaveLength(0);
    expect(useEntriesStore.getState().view).toBe("home");
    expect(useEntriesStore.getState().activeEntryId).toBeNull();
  });

  it("saves a fresh draft once it has people or items", () => {
    useEntriesStore.getState().createEntry();
    useReceiptStore.setState({ people: twoPeople });
    useEntriesStore.getState().goHome();
    expect(useEntriesStore.getState().entries).toHaveLength(1);
  });

  it("keeps an already-saved entry even if the draft is edited back to empty", () => {
    useEntriesStore.getState().importEntry(importedSnapshot);
    useEntriesStore.getState().goHome();
    useEntriesStore.getState().openEntry(useEntriesStore.getState().entries[0].id);
    useReceiptStore.setState({ people: [], items: [] });
    useEntriesStore.getState().goHome();
    expect(useEntriesStore.getState().entries).toHaveLength(1);
  });

  it("updates an existing entry's snapshot rather than duplicating it", () => {
    useEntriesStore.getState().importEntry(importedSnapshot);
    useEntriesStore.getState().goHome();
    const id = useEntriesStore.getState().entries[0].id;
    useEntriesStore.getState().openEntry(id);
    useReceiptStore.getState().setReceiptName("Renamed");
    useEntriesStore.getState().goHome();
    expect(useEntriesStore.getState().entries).toHaveLength(1);
    expect(useEntriesStore.getState().entries[0].snapshot.receiptName).toBe("Renamed");
  });
});

describe("deleteEntry", () => {
  it("removes the entry with the given id and leaves the others", () => {
    useEntriesStore.setState({
      entries: [
        { id: "e1", updatedAt: 1, snapshot: importedSnapshot },
        { id: "e2", updatedAt: 2, snapshot: importedSnapshot },
      ],
    });
    useEntriesStore.getState().deleteEntry("e1");
    expect(useEntriesStore.getState().entries.map((e) => e.id)).toEqual(["e2"]);
  });
});

describe("setHomeRegion", () => {
  it("sets the default region for future entries", () => {
    useEntriesStore.getState().setHomeRegion("GB");
    expect(useEntriesStore.getState().homeRegion).toBe("GB");
  });
});
