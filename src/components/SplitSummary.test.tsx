import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { SplitSummary } from "./SplitSummary";
import { useReceiptStore } from "../store/useReceiptStore";
import * as storeModule from "../store/useReceiptStore";

const { addImageMock, saveMock } = vi.hoisted(() => ({
  addImageMock: vi.fn(),
  saveMock: vi.fn(),
}));

vi.mock("jspdf", () => ({
  default: vi.fn().mockImplementation(function MockJsPDF() {
    return { addImage: addImageMock, save: saveMock };
  }),
}));

vi.mock("html-to-image", () => ({
  toPng: vi.fn((el: HTMLElement, opts?: { filter?: (n: Node) => boolean }) => {
    // Invoke the real filter callback against both a normal node and a
    // data-export-hide node so its own lines/branches count toward coverage,
    // even though the real rasterizer never runs under jsdom.
    opts?.filter?.(el);
    const hidden = document.createElement("div");
    hidden.dataset.exportHide = "";
    opts?.filter?.(hidden);
    opts?.filter?.(document.createTextNode("text") as unknown as HTMLElement);
    return Promise.resolve("data:image/png;base64,abc");
  }),
}));

import { toPng } from "html-to-image";

describe("SplitSummary", () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    HTMLImageElement.prototype.decode = vi.fn().mockResolvedValue(undefined);
    vi.mocked(toPng).mockResolvedValue("data:image/png;base64,abc");
    addImageMock.mockClear();
    saveMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function seedTwoPeopleOneItem() {
    useReceiptStore.setState({
      receiptName: "Joe's Diner",
      receiptDate: "2026-08-23",
      people: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
      items: [{ id: "i1", name: "Pizza", quantity: 1, unitPriceCents: 2000 }],
      splitMode: "assign",
      assignments: { i1: ["p1", "p2"] },
    });
  }

  it("shows all items for every person when splitMode is even", () => {
    useReceiptStore.setState({
      people: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
      items: [{ id: "i1", name: "Pizza", quantity: 1, unitPriceCents: 2000 }],
      splitMode: "even",
    });
    render(<SplitSummary />);
    // once in ReceiptCard's own list, plus once per person row (2 people).
    expect(screen.getAllByText("Pizza")).toHaveLength(3);
  });

  it("shows only assigned items per person when splitMode is assign", () => {
    useReceiptStore.setState({
      people: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
      items: [
        { id: "i1", name: "Pizza", quantity: 1, unitPriceCents: 2000 },
        { id: "i2", name: "Coffee", quantity: 1, unitPriceCents: 500 },
      ],
      splitMode: "assign",
      assignments: { i1: ["p1", "p2"], i2: ["p1"] },
    });
    render(<SplitSummary />);
    // Coffee shows once in ReceiptCard's list, once for Alice's row, never for Bob's.
    expect(screen.getAllByText("Coffee")).toHaveLength(2);
  });

  it("excludes an item that has no entry in the assignments map at all", () => {
    useReceiptStore.setState({
      people: [{ id: "p1", name: "Alice" }],
      items: [{ id: "i1", name: "", quantity: 1, unitPriceCents: 2000 }],
      splitMode: "assign",
      assignments: {},
    });
    render(<SplitSummary />);
    // Shows once (in ReceiptCard's own list) but not a second time in Alice's row.
    expect(screen.getAllByText("Untitled item")).toHaveLength(1);
  });

  it("shows an Untitled item fallback for an assigned item with no name", () => {
    useReceiptStore.setState({
      people: [{ id: "p1", name: "Alice" }],
      items: [{ id: "i1", name: "", quantity: 1, unitPriceCents: 2000 }],
      splitMode: "assign",
      assignments: { i1: ["p1"] },
    });
    render(<SplitSummary />);
    expect(screen.getAllByText("Untitled item")).toHaveLength(2); // ReceiptCard + the person row
  });

  it("copies text with no date line and an Untitled item name when both are empty", async () => {
    useReceiptStore.setState({
      receiptName: "Joe's Diner",
      receiptDate: "",
      people: [{ id: "p1", name: "Alice" }],
      items: [{ id: "i1", name: "", quantity: 1, unitPriceCents: 2000 }],
      splitMode: "even",
    });
    render(<SplitSummary />);
    fireEvent.click(screen.getByRole("button", { name: "Copy to clipboard" }));
    await vi.waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled());
    const text = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0];
    expect(text).not.toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    expect(text).toContain("Untitled item");
  });

  it("copies the formatted receipt text and shows Copied! for 2 seconds", async () => {
    vi.useFakeTimers();
    seedTwoPeopleOneItem();
    render(<SplitSummary />);
    fireEvent.click(screen.getByRole("button", { name: "Copy to clipboard" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    const text = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0];
    expect(text).toContain("Joe's Diner");
    expect(screen.getByRole("button", { name: "Copied!" })).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole("button", { name: "Copy to clipboard" })).toBeInTheDocument();
  });

  it("exports as PNG by creating a download link from the captured image", async () => {
    seedTwoPeopleOneItem();
    render(<SplitSummary />);
    let captured: HTMLAnchorElement | null = null;
    const originalCreateElement = document.createElement.bind(document);
    const createSpy = vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === "a") captured = el as HTMLAnchorElement;
      return el;
    });
    fireEvent.click(screen.getByRole("button", { name: "Export as PNG" }));
    await vi.waitFor(() => expect(captured).not.toBeNull());
    expect(toPng).toHaveBeenCalled();
    expect(captured!.href).toContain("data:image/png");
    expect(captured!.download).toBe("Joes-Diner-2026-08-23.png");
    createSpy.mockRestore();
  });

  it("exports as PDF via jsPDF with the captured image", async () => {
    seedTwoPeopleOneItem();
    HTMLImageElement.prototype.decode = vi.fn().mockImplementation(function (this: HTMLImageElement) {
      Object.defineProperty(this, "width", { value: 200, configurable: true });
      Object.defineProperty(this, "height", { value: 100, configurable: true });
      return Promise.resolve(undefined);
    });
    render(<SplitSummary />);
    fireEvent.click(screen.getByRole("button", { name: "Export as PDF" }));
    await vi.waitFor(() => expect(saveMock).toHaveBeenCalled());
    expect(addImageMock).toHaveBeenCalled();
    expect(saveMock).toHaveBeenCalledWith("Joes-Diner-2026-08-23.pdf");
  });

  it("uses just the receipt name as the filename base when no date is set", async () => {
    useReceiptStore.setState({
      receiptName: "Joe's Diner",
      receiptDate: "",
      people: [{ id: "p1", name: "Alice" }],
      items: [],
    });
    render(<SplitSummary />);
    fireEvent.click(screen.getByRole("button", { name: "Export as PDF" }));
    await vi.waitFor(() => expect(saveMock).toHaveBeenCalled());
    expect(saveMock).toHaveBeenCalledWith("Joes-Diner.pdf");
  });

  it("logs an error and does not throw when PNG export fails", async () => {
    seedTwoPeopleOneItem();
    vi.mocked(toPng).mockRejectedValueOnce(new Error("boom"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<SplitSummary />);
    fireEvent.click(screen.getByRole("button", { name: "Export as PNG" }));
    await vi.waitFor(() => expect(errorSpy).toHaveBeenCalled());
    expect(errorSpy).toHaveBeenCalledWith("Export as PNG failed", expect.any(Error));
    errorSpy.mockRestore();
  });

  it("logs an error and does not throw when PDF export fails", async () => {
    seedTwoPeopleOneItem();
    vi.mocked(toPng).mockRejectedValueOnce(new Error("boom"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<SplitSummary />);
    fireEvent.click(screen.getByRole("button", { name: "Export as PDF" }));
    await vi.waitFor(() => expect(errorSpy).toHaveBeenCalled());
    expect(errorSpy).toHaveBeenCalledWith("Export as PDF failed", expect.any(Error));
    errorSpy.mockRestore();
  });

  it("falls back to 0 for a person missing from the split result (defensive)", async () => {
    // Structurally, `useSplitResult()` always includes every person from the
    // store's `people` array (it derives from the same list), so the `?? 0`
    // fallbacks reading `result.personTotals`/`personTaxCents`/`personServiceCents`
    // can't be reached through the real store. Stub the result directly to
    // exercise that defensive fallback.
    useReceiptStore.setState({ people: [{ id: "p1", name: "Alice" }], items: [] });
    const spy = vi.spyOn(storeModule, "useSplitResult").mockReturnValue({
      personTotals: {},
      personTaxCents: {},
      personServiceCents: {},
      itemSubtotalCents: 0,
      grandTotalCents: 0,
    });
    render(<SplitSummary />);
    expect(screen.getAllByText("$0.00").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Copy to clipboard" }));
    await vi.waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled());
    spy.mockRestore();
  });

  it("renders the per-person total, item share, tax share, and service share", () => {
    useReceiptStore.setState({
      people: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
      items: [{ id: "i1", name: "Pizza", quantity: 1, unitPriceCents: 2000 }],
      taxCents: 250,
      serviceCents: 100,
      splitMode: "assign",
      assignments: { i1: ["p1", "p2"] },
    });
    render(<SplitSummary />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getAllByText("Tax")).toHaveLength(3); // ReceiptCard + 2 person rows
    expect(screen.getAllByText("Service charge")).toHaveLength(3);
  });
});
