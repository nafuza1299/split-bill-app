import type { KeyboardEvent, MouseEvent } from "react";
import { Button } from "./catalyst/Button/Button";
import { Card } from "./catalyst/Card/Card";
import { DownloadMenu, ExcelIcon, PdfIcon, PngIcon } from "./catalyst/DownloadMenu/DownloadMenu";
import { entryTitle, receiptTextInputFromSnapshot } from "../lib/entries";
import { formatMoney } from "../lib/money";
import { sanitizeFilename } from "../lib/receiptText";
import { buildTemplateWorkbook } from "../lib/receiptTemplate";
import { calculateSplit } from "../lib/splitCalculator";
import { buildReceiptTextPdf, buildReceiptTextPng } from "../lib/textExport";
import type { SavedEntry } from "../store/useEntriesStore";

export interface EntryCardProps {
  entry: SavedEntry;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

export function EntryCard({ entry, onOpen, onDelete }: EntryCardProps) {
  const { snapshot } = entry;
  const result = calculateSplit({
    people: snapshot.people,
    items: snapshot.items,
    taxCents: snapshot.taxCents,
    serviceCents: snapshot.serviceCents,
    mode: snapshot.splitMode ?? "even",
    assignments: snapshot.assignments,
  });

  const handleDelete = (e: MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${entryTitle(snapshot)}"?`)) onDelete(entry.id);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen(entry.id);
    }
  };

  const filenameBase = sanitizeFilename(snapshot.receiptName) + (snapshot.receiptDate ? `-${snapshot.receiptDate}` : "");

  const handleExportPng = () => {
    try {
      const dataUrl = buildReceiptTextPng(receiptTextInputFromSnapshot(snapshot, result));
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${filenameBase}.png`;
      a.click();
    } catch (err) {
      console.error("Export as PNG failed", err);
    }
  };

  const handleExportPdf = () => {
    try {
      buildReceiptTextPdf(receiptTextInputFromSnapshot(snapshot, result)).save(`${filenameBase}.pdf`);
    } catch (err) {
      console.error("Export as PDF failed", err);
    }
  };

  const handleExportExcel = async () => {
    try {
      const workbook = buildTemplateWorkbook(snapshot);
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filenameBase}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export as Excel failed", err);
    }
  };

  return (
    <Card
      interactive
      onClick={() => onOpen(entry.id)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <Card.Header className="flex items-start justify-between gap-2">
        <div>
          <Card.Title>{entryTitle(snapshot)}</Card.Title>
          {snapshot.receiptDate && (
            <Card.Description>{new Date(snapshot.receiptDate).toLocaleDateString()}</Card.Description>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <DownloadMenu
            items={[
              { label: "PNG", icon: <PngIcon />, onSelect: handleExportPng },
              { label: "PDF", icon: <PdfIcon />, onSelect: handleExportPdf },
              { label: "Excel", icon: <ExcelIcon />, onSelect: handleExportExcel },
            ]}
          />
          <Button variant="ghost" size="sm" iconOnly aria-label="Delete entry" onClick={handleDelete}>
            ✕
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="flex items-center justify-between text-sm text-text-muted">
          <span>{snapshot.people.length} people</span>
          <span className="font-semibold text-text">{formatMoney(result.grandTotalCents, snapshot.currency)}</span>
        </div>
      </Card.Body>
    </Card>
  );
}
