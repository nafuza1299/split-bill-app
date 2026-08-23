import { useState } from "react";
import { Button } from "./catalyst/Button/Button";
import { Card } from "./catalyst/Card/Card";
import { ReceiptCard } from "./ReceiptCard";
import { formatMoney } from "../lib/money";
import { formatReceiptText } from "../lib/receiptText";
import { useReceiptStore, useSplitResult } from "../store/useReceiptStore";
import { personItemShareCents, type ReceiptItem } from "../lib/splitCalculator";

export function SplitSummary() {
  const receiptName = useReceiptStore((s) => s.receiptName);
  const receiptDate = useReceiptStore((s) => s.receiptDate);
  const people = useReceiptStore((s) => s.people);
  const items = useReceiptStore((s) => s.items);
  const taxCents = useReceiptStore((s) => s.taxCents);
  const serviceCents = useReceiptStore((s) => s.serviceCents);
  const assignments = useReceiptStore((s) => s.assignments);
  const splitMode = useReceiptStore((s) => s.splitMode);
  const result = useSplitResult();
  const [copied, setCopied] = useState(false);

  const itemsForPerson = (personId: string): ReceiptItem[] =>
    splitMode === "assign"
      ? items.filter((item) => (assignments[item.id] ?? []).includes(personId))
      : items;

  const splitAmongCount = (itemId: string): number =>
    splitMode === "assign" ? (assignments[itemId] ?? []).length : people.length;

  const handleCopy = async () => {
    const text = formatReceiptText({
      receiptName,
      dateLabel: receiptDate ? new Date(receiptDate).toLocaleDateString() : "",
      items,
      taxCents,
      serviceCents,
      itemSubtotalCents: result.itemSubtotalCents,
      grandTotalCents: result.grandTotalCents,
      people: people.map((person) => ({
        name: person.name,
        totalCents: result.personTotals[person.id] ?? 0,
        itemNames: itemsForPerson(person.id).map((item) => item.name || "Untitled item"),
      })),
    });
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <ReceiptCard showSplit />

      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div>
              <Card.Title>Summary</Card.Title>
              <Card.Description>Here's who owes what.</Card.Description>
            </div>
            <Button variant="secondary" size="sm" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy to clipboard"}
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            {people.map((person) => (
              <div key={person.id}>
                <div className="flex items-center justify-between">
                  <span className="text-text">{person.name}</span>
                  <span className="font-medium text-text">
                    ${formatMoney(result.personTotals[person.id] ?? 0)}
                  </span>
                </div>
                <div className="mt-1.5 space-y-1">
                  {itemsForPerson(person.id).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm text-text-muted">
                      <span>{item.name || "Untitled item"}</span>
                      <span>${formatMoney(personItemShareCents(item, splitAmongCount(item.id)))}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-sm text-text-muted">
                    <span>Tax</span>
                    <span>${formatMoney(result.personTaxCents[person.id] ?? 0)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-text-muted">
                    <span>Service charge</span>
                    <span>${formatMoney(result.personServiceCents[person.id] ?? 0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
        <Card.Footer>
          <span className="text-sm text-text-muted">Total</span>
          <span className="text-sm font-semibold text-text">${formatMoney(result.grandTotalCents)}</span>
        </Card.Footer>
      </Card>
    </div>
  );
}
