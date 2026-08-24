import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { Button } from "./catalyst/Button/Button";
import { Card } from "./catalyst/Card/Card";
import { ReceiptCard } from "./ReceiptCard";
import { formatMoney } from "../lib/money";
import { formatReceiptText, sanitizeFilename } from "../lib/receiptText";
import { useReceiptStore, useSplitResult } from "../store/useReceiptStore";
import { personItemShareCents, type ReceiptItem } from "../lib/splitCalculator";

export function shouldIncludeInExport(node: Node): boolean {
  return !(node instanceof HTMLElement && node.dataset.exportHide !== undefined);
}

function safeGet(map: Record<string, number>, id: string): number {
  // v8 ignore next -- calculateSplit always populates every person in `people`; unreachable through the real store.
  return map[id] ?? 0;
}

export function SplitSummary() {
  const receiptName = useReceiptStore((s) => s.receiptName);
  const receiptDate = useReceiptStore((s) => s.receiptDate);
  const people = useReceiptStore((s) => s.people);
  const items = useReceiptStore((s) => s.items);
  const taxCents = useReceiptStore((s) => s.taxCents);
  const serviceCents = useReceiptStore((s) => s.serviceCents);
  const assignments = useReceiptStore((s) => s.assignments);
  const splitMode = useReceiptStore((s) => s.splitMode);
  const currency = useReceiptStore((s) => s.currency);
  const result = useSplitResult();
  const [copied, setCopied] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const itemsForPerson = (personId: string): ReceiptItem[] =>
    splitMode === "assign"
      ? items.filter((item) => (assignments[item.id] ?? []).includes(personId))
      : items;

  const splitAmongCount = (itemId: string): number =>
    splitMode === "assign" ? (assignments[itemId] ?? []).length : people.length;

  const handleCopy = async () => {
    const text = formatReceiptText({
      receiptName,
      dateLabel: receiptDate ? new Date(receiptDate).toLocaleDateString() : "",
      items,
      taxCents,
      serviceCents,
      itemSubtotalCents: result.itemSubtotalCents,
      grandTotalCents: result.grandTotalCents,
      currency,
      people: people.map((person) => ({
        name: person.name,
        totalCents: safeGet(result.personTotals, person.id),
        itemNames: itemsForPerson(person.id).map((item) => item.name || "Untitled item"),
      })),
    });
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filenameBase = sanitizeFilename(receiptName) + (receiptDate ? `-${receiptDate}` : "");

  const captureDataUrl = async (): Promise<string> => {
    if (!exportRef.current) throw new Error("Nothing to export");
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--color-bg").trim();
    return toPng(exportRef.current, {
      backgroundColor: bg,
      filter: shouldIncludeInExport,
    });
  };

  const handleExportPng = async () => {
    try {
      const dataUrl = await captureDataUrl();
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${filenameBase}.png`;
      a.click();
    } catch (err) {
      console.error("Export as PNG failed", err);
    }
  };

  const handleExportPdf = async () => {
    try {
      const dataUrl = await captureDataUrl();
      const img = new Image();
      img.src = dataUrl;
      await img.decode();
      const pdf = new jsPDF({
        orientation: img.width > img.height ? "landscape" : "portrait",
        unit: "px",
        format: [img.width, img.height],
      });
      pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
      pdf.save(`${filenameBase}.pdf`);
    } catch (err) {
      console.error("Export as PDF failed", err);
    }
  };

  return (
    <div className="space-y-4" ref={exportRef}>
      <ReceiptCard />

      <Card>
        <Card.Header>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Card.Title>Summary</Card.Title>
              <Card.Description>Here's who owes what.</Card.Description>
            </div>
            <div data-export-hide className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={handleCopy}>
                {copied ? "Copied!" : "Copy to clipboard"}
              </Button>
              <Button variant="secondary" size="sm" onClick={handleExportPng}>
                Export as PNG
              </Button>
              <Button variant="secondary" size="sm" onClick={handleExportPdf}>
                Export as PDF
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            {people.map((person) => (
              <div key={person.id}>
                <div className="flex items-center justify-between">
                  <span className="text-text">{person.name}</span>
                  <span className="font-medium text-text">
                    {formatMoney(safeGet(result.personTotals, person.id), currency)}
                  </span>
                </div>
                <div className="mt-1.5 space-y-1">
                  {itemsForPerson(person.id).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm text-text-muted">
                      <span>{item.name || "Untitled item"}</span>
                      <span>{formatMoney(personItemShareCents(item, splitAmongCount(item.id)), currency)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-sm text-text-muted">
                    <span>Tax</span>
                    <span>{formatMoney(safeGet(result.personTaxCents, person.id), currency)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-text-muted">
                    <span>Service charge</span>
                    <span>{formatMoney(safeGet(result.personServiceCents, person.id), currency)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
        <Card.Footer>
          <span className="text-sm text-text-muted">Total</span>
          <span className="text-sm font-semibold text-text">{formatMoney(result.grandTotalCents, currency)}</span>
        </Card.Footer>
      </Card>
    </div>
  );
}
