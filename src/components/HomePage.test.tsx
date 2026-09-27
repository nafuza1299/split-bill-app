import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { HomePage } from "./HomePage";
import { ThemeProvider } from "./catalyst/theme/ThemeProvider";
import { useEntriesStore } from "../store/useEntriesStore";
import { useReceiptStore } from "../store/useReceiptStore";
import type { ReceiptSnapshot } from "../lib/entries";

const { parseTemplateWorkbookMock, loadMock } = vi.hoisted(() => ({
  parseTemplateWorkbookMock: vi.fn(),
  loadMock: vi.fn(() => Promise.resolve()),
}));

vi.mock("../lib/receiptTemplate", () => ({
  parseTemplateWorkbook: parseTemplateWorkbookMock,
}));

vi.mock("exceljs", () => ({
  default: {
    Workbook: vi.fn().mockImplementation(function MockWorkbook() {
      return { xlsx: { load: loadMock } };
    }),
  },
}));

const importedSnapshot: ReceiptSnapshot = {
  step: "people",
  receiptName: "Imported Trip",
  receiptDate: "2026-03-05",
  people: [{ id: "p1", name: "Alice" }],
  items: [{ id: "i1", name: "Taxi", quantity: 1, unitPriceCents: 1500 }],
  taxCents: 0,
  serviceCents: 0,
  currency: "USD",
  splitMode: "even",
  assignments: {},
  visitedSteps: ["people"],
  detectedRegion: "US",
  currencyAutoDetected: false,
};

function selectFile(file: File) {
  const input = screen.getByLabelText("Choose Excel file to import");
  fireEvent.change(input, { target: { files: [file] } });
}

beforeEach(() => {
  parseTemplateWorkbookMock.mockReset();
  loadMock.mockClear();
});

describe("HomePage", () => {
  it("shows no entry cards when there are none", () => {
    render(<ThemeProvider><HomePage /></ThemeProvider>);
    expect(screen.queryByRole("button", { name: /Imported Trip/ })).not.toBeInTheDocument();
  });

  it("renders a card for each saved entry, most recently updated first", () => {
    useEntriesStore.setState({
      entries: [
        { id: "old", updatedAt: 1, snapshot: { ...importedSnapshot, receiptName: "Old Trip" } },
        { id: "new", updatedAt: 2, snapshot: { ...importedSnapshot, receiptName: "New Trip" } },
      ],
    });
    render(<ThemeProvider><HomePage /></ThemeProvider>);
    const cards = screen.getAllByRole("button", { name: /Trip/ });
    expect(cards[0]).toHaveAccessibleName(expect.stringContaining("New Trip"));
    expect(cards[1]).toHaveAccessibleName(expect.stringContaining("Old Trip"));
  });

  it("opens an entry when its card is clicked", () => {
    useEntriesStore.setState({
      entries: [{ id: "e1", updatedAt: 1, snapshot: importedSnapshot }],
    });
    render(<ThemeProvider><HomePage /></ThemeProvider>);
    fireEvent.click(screen.getByRole("button", { name: /Imported Trip/ }));
    expect(useEntriesStore.getState().view).toBe("wizard");
    expect(useEntriesStore.getState().activeEntryId).toBe("e1");
  });

  it("deletes an entry when its card is deleted", () => {
    useEntriesStore.setState({
      entries: [{ id: "e1", updatedAt: 1, snapshot: importedSnapshot }],
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<ThemeProvider><HomePage /></ThemeProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Delete entry" }));
    expect(useEntriesStore.getState().entries).toHaveLength(0);
    vi.restoreAllMocks();
  });

  it("creates a fresh entry on click of + New split bill", () => {
    render(<ThemeProvider><HomePage /></ThemeProvider>);
    fireEvent.click(screen.getByText("+ New split bill"));
    expect(useEntriesStore.getState().view).toBe("wizard");
  });

  it("creates a fresh entry on Enter/Space over + New split bill", () => {
    render(<ThemeProvider><HomePage /></ThemeProvider>);
    fireEvent.keyDown(screen.getByRole("button", { name: "+ New split bill" }), { key: "Enter" });
    expect(useEntriesStore.getState().view).toBe("wizard");
  });

  it("does not create an entry on an unrelated key over + New split bill", () => {
    render(<ThemeProvider><HomePage /></ThemeProvider>);
    fireEvent.keyDown(screen.getByRole("button", { name: "+ New split bill" }), { key: "Tab" });
    expect(useEntriesStore.getState().view).toBe("home");
  });

  it("opens the file picker on click of Import from Excel", () => {
    render(<ThemeProvider><HomePage /></ThemeProvider>);
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: /Import from Excel/ }));
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it("opens the file picker on Enter/Space over Import from Excel", () => {
    render(<ThemeProvider><HomePage /></ThemeProvider>);
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});
    fireEvent.keyDown(screen.getByRole("button", { name: /Import from Excel/ }), { key: " " });
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it("does not open the file picker on an unrelated key over Import from Excel", () => {
    render(<ThemeProvider><HomePage /></ThemeProvider>);
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});
    fireEvent.keyDown(screen.getByRole("button", { name: /Import from Excel/ }), { key: "Tab" });
    expect(clickSpy).not.toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  describe("region picker", () => {
    it("defaults to the browser-detected region when none is set", () => {
      useEntriesStore.setState({ homeRegion: null });
      render(<ThemeProvider><HomePage /></ThemeProvider>);
      expect(screen.getByRole("combobox", { name: /Region/ })).toBeInTheDocument();
    });

    it("sets the home region when a country is picked, for future new entries", () => {
      useEntriesStore.setState({ homeRegion: "US" });
      render(<ThemeProvider><HomePage /></ThemeProvider>);
      fireEvent.click(screen.getByRole("combobox", { name: /Region/ }));
      fireEvent.click(screen.getByRole("option", { name: /Japan/ }));
      expect(useEntriesStore.getState().homeRegion).toBe("JP");
    });
  });
});

describe("HomePage — Import from Excel", () => {
  it("imports a valid file into a new wizard entry", async () => {
    parseTemplateWorkbookMock.mockReturnValue(importedSnapshot);
    render(<ThemeProvider><HomePage /></ThemeProvider>);
    selectFile(new File(["stub"], "bill.xlsx"));

    await vi.waitFor(() => expect(useEntriesStore.getState().view).toBe("wizard"));
    expect(loadMock).toHaveBeenCalled();
    expect(useReceiptStore.getState().receiptName).toBe("Imported Trip");
    expect(useReceiptStore.getState().people).toEqual(importedSnapshot.people);
  });

  it("alerts and stays on Home when the file can't be parsed", async () => {
    parseTemplateWorkbookMock.mockImplementation(() => {
      throw new Error("This doesn't look like a Split Bill Excel file.");
    });
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<ThemeProvider><HomePage /></ThemeProvider>);
    selectFile(new File(["stub"], "not-a-bill.xlsx"));

    await vi.waitFor(() => expect(alertSpy).toHaveBeenCalledWith("This doesn't look like a Split Bill Excel file."));
    expect(useEntriesStore.getState().view).toBe("home");
    alertSpy.mockRestore();
  });

  it("alerts with a generic message when a non-Error is thrown", async () => {
    parseTemplateWorkbookMock.mockImplementation(() => {
      throw "not an Error instance";
    });
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<ThemeProvider><HomePage /></ThemeProvider>);
    selectFile(new File(["stub"], "bill.xlsx"));

    await vi.waitFor(() => expect(alertSpy).toHaveBeenCalledWith("Couldn't import that file."));
    alertSpy.mockRestore();
  });

  it("does nothing when the file input is cleared without picking a file", () => {
    render(<ThemeProvider><HomePage /></ThemeProvider>);
    const input = screen.getByLabelText("Choose Excel file to import") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });
    expect(useEntriesStore.getState().view).toBe("home");
    expect(loadMock).not.toHaveBeenCalled();
  });
});
