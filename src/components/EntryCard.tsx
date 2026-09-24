import type { KeyboardEvent, MouseEvent } from "react";
import { Button } from "./catalyst/Button/Button";
import { Card } from "./catalyst/Card/Card";
import { entryTitle } from "../lib/entries";
import { formatMoney } from "../lib/money";
import { calculateSplit } from "../lib/splitCalculator";
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
        <Button variant="ghost" size="sm" iconOnly aria-label="Delete entry" onClick={handleDelete}>
          ✕
        </Button>
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
