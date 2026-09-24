import { Card } from "./catalyst/Card/Card";
import { CountrySelect } from "./catalyst/CountrySelect/CountrySelect";
import { EntryCard } from "./EntryCard";
import { detectRegion } from "../lib/locale";
import { useEntriesStore } from "../store/useEntriesStore";

export function HomePage() {
  const entries = useEntriesStore((s) => s.entries);
  const homeRegion = useEntriesStore((s) => s.homeRegion);
  const setHomeRegion = useEntriesStore((s) => s.setHomeRegion);
  const openEntry = useEntriesStore((s) => s.openEntry);
  const createEntry = useEntriesStore((s) => s.createEntry);
  const deleteEntry = useEntriesStore((s) => s.deleteEntry);

  const sortedEntries = [...entries].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="mx-auto flex min-h-svh max-w-4xl flex-col gap-6 px-4 pt-10 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-text">Split Bill</h1>
        <CountrySelect id="home-region" label="Region" value={homeRegion ?? detectRegion()} onChange={setHomeRegion} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
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
      </div>
    </div>
  );
}
