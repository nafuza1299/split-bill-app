import { useRef, type ChangeEvent } from "react";
import ExcelJS from "exceljs";
import { Card } from "./catalyst/Card/Card";
import { CountrySelect } from "./catalyst/CountrySelect/CountrySelect";
import { ThemeToggle } from "./catalyst/ThemeToggle/ThemeToggle";
import { EntryCard } from "./EntryCard";
import { detectRegion } from "../lib/locale";
import { parseTemplateWorkbook } from "../lib/receiptTemplate";
import { useEntriesStore } from "../store/useEntriesStore";

export function HomePage() {
  const entries = useEntriesStore((s) => s.entries);
  const homeRegion = useEntriesStore((s) => s.homeRegion);
  const setHomeRegion = useEntriesStore((s) => s.setHomeRegion);
  const openEntry = useEntriesStore((s) => s.openEntry);
  const createEntry = useEntriesStore((s) => s.createEntry);
  const importEntry = useEntriesStore((s) => s.importEntry);
  const deleteEntry = useEntriesStore((s) => s.deleteEntry);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedEntries = [...entries].sort((a, b) => b.updatedAt - a.updatedAt);

  const handleImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      importEntry(parseTemplateWorkbook(workbook));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Couldn't import that file.");
    }
  };

  return (
    <div className="mx-auto flex min-h-svh max-w-4xl flex-col gap-6 px-4 pt-10 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-text">Split Bill</h1>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <CountrySelect id="home-region" label="Region" value={homeRegion ?? detectRegion()} onChange={setHomeRegion} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sortedEntries.map((entry) => (
          <EntryCard key={entry.id} entry={entry} onOpen={openEntry} onDelete={deleteEntry} />
        ))}

        <Card
          interactive
          onClick={createEntry}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              createEntry();
            }
          }}
          role="button"
          tabIndex={0}
          className="flex min-h-32 items-center justify-center border-dashed"
        >
          <span className="text-sm font-medium text-text-muted">+ New split bill</span>
        </Card>

        <Card
          interactive
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
          className="flex min-h-32 items-center justify-center border-dashed"
        >
          <span className="text-sm font-medium text-text-muted">Import from Excel</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            className="sr-only"
            aria-label="Choose Excel file to import"
            onChange={handleImportFile}
          />
        </Card>
      </div>
    </div>
  );
}
