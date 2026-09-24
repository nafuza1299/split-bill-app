import jsPDF from "jspdf";
import { formatReceiptText, type ReceiptTextInput } from "./receiptText";

const PAGE_MARGIN = 15;
const LINE_HEIGHT = 7;
const PAGE_BOTTOM = 280;

/** A simple multi-page text PDF, for exporting a receipt with no on-screen view to screenshot (e.g. a Home card). */
export function buildReceiptTextPdf(input: ReceiptTextInput): jsPDF {
  const pdf = new jsPDF();
  let y = PAGE_MARGIN;
  for (const line of formatReceiptText(input).split("\n")) {
    if (y > PAGE_BOTTOM) {
      pdf.addPage();
      y = PAGE_MARGIN;
    }
    pdf.text(line, PAGE_MARGIN, y);
    y += LINE_HEIGHT;
  }
  return pdf;
}

const PNG_FONT_SIZE = 16;
const PNG_LINE_HEIGHT = 22;
const PNG_PADDING = 20;
const PNG_WIDTH = 500;

/** A plain text-on-canvas PNG data URL of the same receipt text, for a Home card with no on-screen view. */
export function buildReceiptTextPng(input: ReceiptTextInput): string {
  const lines = formatReceiptText(input).split("\n");
  const canvas = document.createElement("canvas");
  canvas.width = PNG_WIDTH;
  canvas.height = lines.length * PNG_LINE_HEIGHT + PNG_PADDING * 2;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000000";
  ctx.font = `${PNG_FONT_SIZE}px monospace`;
  lines.forEach((line, index) => {
    ctx.fillText(line, PNG_PADDING, PNG_PADDING + (index + 1) * PNG_LINE_HEIGHT - 6);
  });

  return canvas.toDataURL("image/png");
}
