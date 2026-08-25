import { Button } from "./catalyst/Button/Button";
import { Card } from "./catalyst/Card/Card";
import { Input } from "./ui/Input";
import { MoneyInput } from "./ui/MoneyInput";
import { ReceiptOcrUpload } from "./ReceiptOcrUpload";
import { useReceiptStore } from "../store/useReceiptStore";
import { DUPLICATE_NAME_MESSAGE, getDuplicateNameIndices, getMoneyError, getNameError, getQuantityError } from "../lib/validation";

export function ReceiptItemsEditor() {
  const items = useReceiptStore((s) => s.items);
  const addItem = useReceiptStore((s) => s.addItem);
  const removeItem = useReceiptStore((s) => s.removeItem);
  const updateItem = useReceiptStore((s) => s.updateItem);
  const taxCents = useReceiptStore((s) => s.taxCents);
  const serviceCents = useReceiptStore((s) => s.serviceCents);
  const setTax = useReceiptStore((s) => s.setTax);
  const setService = useReceiptStore((s) => s.setService);
  const duplicateIndices = getDuplicateNameIndices(items.map((i) => i.name));

  return (
    <Card>
      <Card.Header>
        <Card.Title>Receipt details</Card.Title>
        <Card.Description>Add each item from the receipt.</Card.Description>
      </Card.Header>
      <Card.Body>
        <div className="space-y-3">
          <ReceiptOcrUpload />
          {items.length > 0 && (
            <div className="grid grid-cols-12 gap-2 text-sm text-text-muted">
              <span className="col-span-6">Item name</span>
              <span className="col-span-2">Qty</span>
              <span className="col-span-3">Unit price</span>
            </div>
          )}
          {items.map((item, index) => (
            <div key={item.id} className="grid grid-cols-12 items-start gap-2">
              <div className="col-span-6">
                <Input
                  label="Item name"
                  hideLabel
                  placeholder="Item name"
                  value={item.name}
                  error={getNameError(item.name) ?? (duplicateIndices.has(index) ? DUPLICATE_NAME_MESSAGE : null)}
                  onChange={(e) => updateItem(item.id, { name: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Input
                  label="Quantity"
                  hideLabel
                  type="number"
                  min={1}
                  value={item.quantity}
                  error={getQuantityError(item.quantity)}
                  onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) || 1 })}
                />
              </div>
              <div className="col-span-3">
                <MoneyInput
                  label="Unit price"
                  hideLabel
                  valueCents={item.unitPriceCents}
                  error={getMoneyError(item.unitPriceCents)}
                  onChangeCents={(cents) => updateItem(item.id, { unitPriceCents: cents })}
                />
              </div>
              <div className="col-span-1">
                <Button
                  variant="ghost"
                  size="md"
                  iconOnly
                  aria-label={`Remove ${item.name || "item"}`}
                  onClick={() => removeItem(item.id)}
                >
                  ✕
                </Button>
              </div>
            </div>
          ))}

          <Button variant="secondary" onClick={addItem}>
            Add item
          </Button>

          <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
            <MoneyInput label="Tax" valueCents={taxCents} error={getMoneyError(taxCents)} onChangeCents={setTax} />
            <MoneyInput
              label="Service charge"
              valueCents={serviceCents}
              error={getMoneyError(serviceCents)}
              onChangeCents={setService}
            />
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
