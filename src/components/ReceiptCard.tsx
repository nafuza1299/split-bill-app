import { Card } from "./catalyst/Card/Card";
import { formatMoney } from "../lib/money";
import { useReceiptStore, useSplitResult } from "../store/useReceiptStore";

export interface ReceiptCardProps {
  showSplit?: boolean;
}

export function ReceiptCard({ showSplit = false }: ReceiptCardProps) {
  const items = useReceiptStore((s) => s.items);
  const people = useReceiptStore((s) => s.people);
  const receiptName = useReceiptStore((s) => s.receiptName);
  const receiptDate = useReceiptStore((s) => s.receiptDate);
  const taxCents = useReceiptStore((s) => s.taxCents);
  const serviceCents = useReceiptStore((s) => s.serviceCents);
  const result = useSplitResult();

  return (
    <Card>
      <Card.Header>
        <Card.Title>{receiptName || "Receipt"}</Card.Title>
        {receiptDate && <Card.Description>{new Date(receiptDate).toLocaleDateString()}</Card.Description>}
      </Card.Header>
      <Card.Body>
        <div className="space-y-1">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-text">
                {item.name || "Untitled item"} <span className="text-text-muted">× {item.quantity}</span>
              </span>
              <span className="text-text">${formatMoney(item.quantity * item.unitPriceCents)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
          <div className="flex items-center justify-between text-text-muted">
            <span>Subtotal</span>
            <span>${formatMoney(result.itemSubtotalCents)}</span>
          </div>
          <div className="flex items-center justify-between text-text-muted">
            <span>Tax</span>
            <span>${formatMoney(taxCents)}</span>
          </div>
          <div className="flex items-center justify-between text-text-muted">
            <span>Service charge</span>
            <span>${formatMoney(serviceCents)}</span>
          </div>
          <div className="flex items-center justify-between font-semibold text-text">
            <span>Total</span>
            <span>${formatMoney(result.grandTotalCents)}</span>
          </div>
        </div>
        {showSplit && (
          <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
            {people.map((person) => (
              <div key={person.id} className="flex items-center justify-between text-text-muted">
                <span>{person.name}</span>
                <span>${formatMoney(result.personTotals[person.id] ?? 0)}</span>
              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
