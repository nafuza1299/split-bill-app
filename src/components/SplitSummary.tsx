import { Card } from "./catalyst/Card/Card";
import { formatCentsToDollars } from "../lib/money";
import { useReceiptStore, useSplitResult } from "../store/useReceiptStore";

export function SplitSummary() {
  const people = useReceiptStore((s) => s.people);
  const result = useSplitResult();

  return (
    <Card>
      <Card.Header>
        <Card.Title>Summary</Card.Title>
        <Card.Description>Here's who owes what.</Card.Description>
      </Card.Header>
      <Card.Body>
        <div className="space-y-2">
          {people.map((person) => (
            <div key={person.id} className="flex items-center justify-between">
              <span className="text-text">{person.name}</span>
              <span className="font-medium text-text">${formatCentsToDollars(result.personTotals[person.id] ?? 0)}</span>
            </div>
          ))}
        </div>
      </Card.Body>
      <Card.Footer>
        <span className="text-sm text-text-muted">Total</span>
        <span className="text-sm font-semibold text-text">${formatCentsToDollars(result.grandTotalCents)}</span>
      </Card.Footer>
    </Card>
  );
}
