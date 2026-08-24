import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { Button } from "./catalyst/Button/Button";
import { Card } from "./catalyst/Card/Card";
import { Tooltip } from "./catalyst/Tooltip/Tooltip";
import { ReceiptCard } from "./ReceiptCard";
import { countryCodes } from "../lib/countryCodes";
import { formatMoney } from "../lib/money";
import { formatPersonShareText, formatReceiptText, sanitizeFilename } from "../lib/receiptText";
import { useReceiptStore, useSplitResult } from "../store/useReceiptStore";
import { personItemShareCents, type Person, type ReceiptItem } from "../lib/splitCalculator";

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
  const [copiedPersonId, setCopiedPersonId] = useState<string | null>(null);
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

  const buildPersonShareText = (person: Person): string =>
    formatPersonShareText({
      receiptName,
      dateLabel: receiptDate ? new Date(receiptDate).toLocaleDateString() : "",
      personName: person.name,
      items: itemsForPerson(person.id).map((item) => ({
        name: item.name || "Untitled item",
        shareCents: personItemShareCents(item, splitAmongCount(item.id)),
      })),
      taxCents: safeGet(result.personTaxCents, person.id),
      serviceCents: safeGet(result.personServiceCents, person.id),
      totalCents: safeGet(result.personTotals, person.id),
      currency,
    });

  const handleCopyPerson = async (person: Person) => {
    await navigator.clipboard.writeText(buildPersonShareText(person));
    setCopiedPersonId(person.id);
    setTimeout(() => setCopiedPersonId((cur) => (cur === person.id ? null : cur)), 2000);
  };

  const dialCodeDigits = (iso2: string | undefined): string =>
    (countryCodes.find((c) => c.iso2 === iso2)?.dialCode ?? "").replace(/\D/g, "");
  const whatsappDigits = (person: Person): string =>
    dialCodeDigits(person.phoneCountry) + (person.phone ?? "").replace(/\D/g, "");
  const canWhatsApp = (person: Person): boolean => whatsappDigits(person).length >= 8;

  const handleWhatsApp = (person: Person) => {
    const url = `https://wa.me/${whatsappDigits(person)}?text=${encodeURIComponent(buildPersonShareText(person))}`;
    window.open(url, "_blank", "noopener,noreferrer");
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
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text">
                      {formatMoney(safeGet(result.personTotals, person.id), currency)}
                    </span>
                    <div data-export-hide className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        aria-label={
                          copiedPersonId === person.id ? `Copied ${person.name}'s share` : `Copy ${person.name}'s share`
                        }
                        onClick={() => handleCopyPerson(person)}
                      >
                        <CopyIcon />
                      </Button>
                      {canWhatsApp(person) ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          iconOnly
                          aria-label={`Share ${person.name}'s share via WhatsApp`}
                          onClick={() => handleWhatsApp(person)}
                        >
                          <WhatsAppIcon />
                        </Button>
                      ) : (
                        <Tooltip content="Add a phone number to share via WhatsApp">
                          <span>
                            <Button
                              variant="ghost"
                              size="sm"
                              iconOnly
                              disabled
                              aria-label={`Share ${person.name}'s share via WhatsApp`}
                            >
                              <WhatsAppIcon />
                            </Button>
                          </span>
                        </Tooltip>
                      )}
                    </div>
                  </div>
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

function CopyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18.2a8.1 8.1 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.7.8-.8.9-.2.2-.3.2-.5.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.2 0-.4.1-.5l.4-.4c.1-.1.2-.2.2-.4.1-.1.1-.3 0-.4-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3.9 2.6 1.1 2.8.1.2 1.9 2.9 4.6 4 .6.3 1.1.4 1.5.6.6.2 1.2.2 1.6.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2-.1-.1-.2-.2-.4-.3Z" />
    </svg>
  );
}
