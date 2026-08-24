import type { PersistStorage, StorageValue } from "zustand/middleware";

// Wraps localStorage so persisted state expires after ttlMs, instead of
// surviving indefinitely across visits.
export function createExpiringStorage<S>(ttlMs: number): PersistStorage<S> {
  return {
    getItem: (name) => {
      const raw = localStorage.getItem(name);
      if (!raw) return null;
      const { savedAt, value } = JSON.parse(raw) as { savedAt: number; value: StorageValue<S> };
      if (Date.now() - savedAt > ttlMs) {
        localStorage.removeItem(name);
        return null;
      }
      return value;
    },
    setItem: (name, value) => {
      localStorage.setItem(name, JSON.stringify({ savedAt: Date.now(), value }));
    },
    removeItem: (name) => localStorage.removeItem(name),
  };
}
