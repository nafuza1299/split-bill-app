import { describe, expect, it, vi } from "vitest";
import type { ReceiptTextInput } from "./receiptText";

const { textMock, addPageMock } = vi.hoisted(() => ({
  textMock: vi.fn(),
  addPageMock: vi.fn(),
}));

vi.mock("jspdf", () => ({
  default: vi.fn().mockImplementation(function MockJsPDF() {
    return { text: textMock, addPage: addPageMock };
  }),
}));

import { buildReceiptTextPdf, buildReceiptTextPng } from "./textExport";

const baseInput: ReceiptTextInput = {
  receiptName: "Joe's Diner",
  dateLabel: "8/23/2026",
  items: [{ id: "i1", name: "Pizza", quantity: 1, unitPriceCents: 2000 }],
  taxCents: 0,
  serviceCents: 0,
  itemSubtotalCents: 2000,
  grandTotalCents: 2000,
  currency: "USD",
  people: [{ name: "Alice", totalCents: 2000, itemNames: ["Pizza"] }],
};

describe("buildReceiptTextPdf", () => {
  it("writes one line of text per line of the formatted receipt", () => {
    buildReceiptTextPdf(baseInput);
    expect(textMock).toHaveBeenCalledWith("Joe's Diner", expect.any(Number), expect.any(Number));
    expect(textMock).toHaveBeenCalledWith("Alice — $20.00 (Pizza)", expect.any(Number), expect.any(Number));
  });

  it("starts a new page once the content overflows one page", () => {
    textMock.mockClear();
    addPageMock.mockClear();
    const manyPeople = Array.from({ length: 80 }, (_, i) => ({
      name: `Person ${i}`,
      totalCents: 100,
      itemNames: [],
    }));
    buildReceiptTextPdf({ ...baseInput, people: manyPeople });
    expect(addPageMock).toHaveBeenCalled();
  });
});

describe("buildReceiptTextPng", () => {
  it("returns a PNG data URL sized to the number of lines", () => {
    const fillTextCalls: unknown[][] = [];
    const originalCreateElement = document.createElement.bind(document);
    const createSpy = vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag !== "canvas") return originalCreateElement(tag);
      const canvas = originalCreateElement("canvas") as HTMLCanvasElement;
      vi.spyOn(canvas, "getContext").mockReturnValue({
        fillRect: vi.fn(),
        fillText: (...args: unknown[]) => fillTextCalls.push(args),
        set fillStyle(_v: string) {},
        set font(_v: string) {},
      } as unknown as CanvasRenderingContext2D);
      vi.spyOn(canvas, "toDataURL").mockReturnValue("data:image/png;base64,stub");
      return canvas;
    });

    const dataUrl = buildReceiptTextPng(baseInput);

    expect(dataUrl).toBe("data:image/png;base64,stub");
    expect(fillTextCalls.some((args) => args[0] === "Joe's Diner")).toBe(true);
    createSpy.mockRestore();
  });

  it("throws when the canvas has no 2D context available", () => {
    const originalCreateElement = document.createElement.bind(document);
    const createSpy = vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag !== "canvas") return originalCreateElement(tag);
      const canvas = originalCreateElement("canvas") as HTMLCanvasElement;
      vi.spyOn(canvas, "getContext").mockReturnValue(null);
      return canvas;
    });

    expect(() => buildReceiptTextPng(baseInput)).toThrow("Canvas 2D context unavailable");
    createSpy.mockRestore();
  });
});
