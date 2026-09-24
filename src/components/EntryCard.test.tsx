import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { EntryCard } from "./EntryCard";
import type { SavedEntry } from "../store/useEntriesStore";

const { saveMock, addRowsMock, writeBufferMock } = vi.hoisted(() => ({
  saveMock: vi.fn(),
  addRowsMock: vi.fn(),
  writeBufferMock: vi.fn(() => Promise.resolve(new Uint8Array([1, 2, 3]))),
}));

vi.mock("jspdf", () => ({
  default: vi.fn().mockImplementation(function MockJsPDF() {
    return { text: vi.fn(), addPage: vi.fn(), save: saveMock };
  }),
}));

vi.mock("exceljs", () => ({
  default: {
    Workbook: vi.fn().mockImplementation(function MockWorkbook() {
      return {
        addWorksheet: vi.fn(() => ({ addRows: addRowsMock })),
        xlsx: { writeBuffer: writeBufferMock },
      };
    }),
  },
}));

const entry: SavedEntry = {
  id: "e1",
  updatedAt: Date.now(),
  snapshot: {
    step: "summary",
    receiptName: "Joe's Diner",
    receiptDate: "2026-08-23",
    people: [{ id: "p1", name: "Alice" }, { id: "p2", name: "Bob" }],
    items: [{ id: "i1", name: "Pizza", quantity: 1, unitPriceCents: 2000 }],
    taxCents: 0,
    serviceCents: 0,
    currency: "USD",
    splitMode: "even",
    assignments: {},
    visitedSteps: ["people", "items", "mode", "summary"],
    detectedRegion: "US",
    currencyAutoDetected: true,
  },
};

function openDownloadMenu() {
  fireEvent.click(screen.getByRole("button", { name: "Download" }));
}

describe("EntryCard", () => {
  beforeEach(() => {
    saveMock.mockClear();
    addRowsMock.mockClear();
    writeBufferMock.mockClear();
  });

  it("shows the title, person count, and total", () => {
    render(<EntryCard entry={entry} onOpen={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Joe's Diner")).toBeInTheDocument();
    expect(screen.getByText("2 people")).toBeInTheDocument();
    expect(screen.getByText("$20.00")).toBeInTheDocument();
  });

  it("calls onOpen when the card itself is clicked", () => {
    const onOpen = vi.fn();
    render(<EntryCard entry={entry} onOpen={onOpen} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Joe's Diner/ }));
    expect(onOpen).toHaveBeenCalledWith("e1");
  });

  it("does not open the entry when the delete button is clicked", () => {
    const onOpen = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<EntryCard entry={entry} onOpen={onOpen} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete entry" }));
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("does not open the entry when the download button is clicked", () => {
    const onOpen = vi.fn();
    render(<EntryCard entry={entry} onOpen={onOpen} onDelete={vi.fn()} />);
    openDownloadMenu();
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("does not open the entry when a download menu item is picked", () => {
    const onOpen = vi.fn();
    render(<EntryCard entry={entry} onOpen={onOpen} onDelete={vi.fn()} />);
    openDownloadMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "PDF" }));
    expect(onOpen).not.toHaveBeenCalled();
  });

  describe("downloading", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("exports as PDF via jsPDF, named after the receipt", () => {
      render(<EntryCard entry={entry} onOpen={vi.fn()} onDelete={vi.fn()} />);
      openDownloadMenu();
      fireEvent.click(screen.getByRole("menuitem", { name: "PDF" }));
      expect(saveMock).toHaveBeenCalledWith("Joes-Diner-2026-08-23.pdf");
    });

    it("exports as Excel via ExcelJS with the built rows", async () => {
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
      render(<EntryCard entry={entry} onOpen={vi.fn()} onDelete={vi.fn()} />);
      openDownloadMenu();
      fireEvent.click(screen.getByRole("menuitem", { name: "Excel" }));
      await vi.waitFor(() => expect(writeBufferMock).toHaveBeenCalled());
      expect(addRowsMock).toHaveBeenCalledWith(expect.arrayContaining([["Joe's Diner"]]));
      clickSpy.mockRestore();
    });

    it("exports as PNG by creating a download link", () => {
      const originalCreateElement = document.createElement.bind(document);
      let captured: HTMLAnchorElement | null = null;
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
      vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
        if (tag === "canvas") {
          const canvas = originalCreateElement("canvas") as HTMLCanvasElement;
          vi.spyOn(canvas, "getContext").mockReturnValue({
            fillRect: vi.fn(),
            fillText: vi.fn(),
            set fillStyle(_v: string) {},
            set font(_v: string) {},
          } as unknown as CanvasRenderingContext2D);
          vi.spyOn(canvas, "toDataURL").mockReturnValue("data:image/png;base64,stub");
          return canvas;
        }
        const el = originalCreateElement(tag);
        if (tag === "a") captured = el as HTMLAnchorElement;
        return el;
      });

      render(<EntryCard entry={entry} onOpen={vi.fn()} onDelete={vi.fn()} />);
      openDownloadMenu();
      fireEvent.click(screen.getByRole("menuitem", { name: "PNG" }));

      expect(captured).not.toBeNull();
      expect(captured!.href).toContain("data:image/png");
      expect(captured!.download).toBe("Joes-Diner-2026-08-23.png");
      clickSpy.mockRestore();
    });
  });
});
