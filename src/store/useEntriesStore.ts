import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { hasContent, snapshotFromReceiptState, type ReceiptSnapshot } from "../lib/entries";
import { useReceiptStore } from "./useReceiptStore";

export type View = "home" | "wizard";

export interface SavedEntry {
  id: string;
  updatedAt: number;
  snapshot: ReceiptSnapshot;
}

interface EntriesState {
  entries: SavedEntry[];
  activeEntryId: string | null;
  view: View;
  /** Default region for newly-created entries only; never read from or written by the wizard's own region pickers. */
  homeRegion: string | null;
  legacyMigrated: boolean;

  openEntry: (id: string) => void;
  createEntry: () => void;
  goHome: () => void;
  deleteEntry: (id: string) => void;
  setHomeRegion: (region: string) => void;
}

function upsertEntry(entries: SavedEntry[], entry: SavedEntry): SavedEntry[] {
  const index = entries.findIndex((e) => e.id === entry.id);
  return index >= 0 ? entries.map((e, i) => (i === index ? entry : e)) : [entry, ...entries];
}

export const useEntriesStore = create<EntriesState>()(
  persist(
    (set, get) => ({
      entries: [],
      activeEntryId: null,
      view: "home",
      homeRegion: null,
      legacyMigrated: false,

      openEntry: (id) => {
        const entry = get().entries.find((e) => e.id === id);
        if (!entry) return;
        useReceiptStore.setState(entry.snapshot);
        set({ activeEntryId: id, view: "wizard" });
      },

      createEntry: () => {
        useReceiptStore.getState().resetAll();
        const region = get().homeRegion;
        if (region) useReceiptStore.getState().setCountry(region);
        set({ activeEntryId: crypto.randomUUID(), view: "wizard" });
      },

      goHome: () => {
        const id = get().activeEntryId;
        const draft = useReceiptStore.getState();
        const snapshot = snapshotFromReceiptState(draft);
        const alreadySaved = id ? get().entries.some((e) => e.id === id) : false;
        if (id && (alreadySaved || hasContent(snapshot))) {
          const entry: SavedEntry = { id, updatedAt: Date.now(), snapshot };
          set((s) => ({ entries: upsertEntry(s.entries, entry) }));
        }
        set({ view: "home", activeEntryId: null });
      },

      deleteEntry: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
      setHomeRegion: (region) => set({ homeRegion: region }),
    }),
    { name: "split-bill-entries", storage: createJSONStorage(() => localStorage) },
  ),
);

// One-time migration of the pre-existing single-draft cache into the entries
// list, so shipping this feature doesn't lose anyone's in-progress bill.
// useReceiptStore's persist rehydration is synchronous (its storage's
// getItem is sync), so getState() here already reflects any cached draft.
{
  const { legacyMigrated, entries } = useEntriesStore.getState();
  if (!legacyMigrated) {
    const draft = useReceiptStore.getState();
    const snapshot = snapshotFromReceiptState(draft);
    const migrated = hasContent(snapshot)
      ? [{ id: crypto.randomUUID(), updatedAt: Date.now(), snapshot }, ...entries]
      : entries;
    useEntriesStore.setState({ legacyMigrated: true, entries: migrated });
  }
}
