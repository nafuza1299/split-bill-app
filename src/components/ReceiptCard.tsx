import { Card } from "./catalyst/Card/Card";
import { formatMoney } from "../lib/money";
import { useReceiptStore, useSplitResult } from "../store/useReceiptStore";

export function ReceiptCard() {
  const items = useReceiptStore((s) => s.items);
  const receiptName = useReceiptStore((s) => s.receiptName);
  const receiptDate = useReceiptStore((s) => s.receiptDate);
  const taxCents = useReceiptStore((s) => s.taxCents);
  const serviceCents = useReceiptStore((s) => s.serviceCents);
  const currency = useReceiptStore((s) => s.currency);
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
              <span className="text-text">{formatMoney(item.quantity * item.unitPriceCents, currency)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
          <div className="flex items-center justify-between text-text-muted">
            <span>Subtotal</span>
            <span>{formatMoney(result.itemSubtotalCents, currency)}</span>
          </div>
          <div className="flex items-center justify-between text-text-muted">
            <span>Tax</span>
            <span>{formatMoney(taxCents, currency)}</span>
          </div>
          <div className="flex items-center justify-between text-text-muted">
            <span>Service charge</span>
            <span>{formatMoney(serviceCents, currency)}</span>
          </div>
          <div className="flex items-center justify-between font-semibold text-text">
            <span>Total</span>
            <span>{formatMoney(result.grandTotalCents, currency)}</span>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
