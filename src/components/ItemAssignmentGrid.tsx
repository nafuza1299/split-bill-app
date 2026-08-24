import { Card } from "./catalyst/Card/Card";
import { Checkbox } from "./ui/Checkbox";
import { ReceiptCard } from "./ReceiptCard";
import { formatMoney } from "../lib/money";
import { useReceiptStore } from "../store/useReceiptStore";

export function ItemAssignmentGrid() {
  const items = useReceiptStore((s) => s.items);
  const people = useReceiptStore((s) => s.people);
  const assignments = useReceiptStore((s) => s.assignments);
  const toggleAssignment = useReceiptStore((s) => s.toggleAssignment);
  const currency = useReceiptStore((s) => s.currency);

  return (
    <div className="space-y-4">
      <ReceiptCard />

      <Card padding="none">
        <Card.Header>
          <Card.Title>Who owes what?</Card.Title>
          <Card.Description>Check off everyone who shared each item.</Card.Description>
        </Card.Header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                {people.map((person) => (
                  <th key={person.id} className="px-4 py-3 text-center font-medium">
                    {person.name || "—"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-text">{item.name || "Untitled item"}</td>
                  <td className="px-4 py-3 text-right text-text">
                    {formatMoney(item.quantity * item.unitPriceCents, currency)}
                  </td>
                  {people.map((person) => (
                    <td key={person.id} className="px-4 py-3 text-center">
                      <Checkbox
                        ariaLabel={`${person.name || "Person"} had ${item.name || "this item"}`}
                        checked={(assignments[item.id] ?? []).includes(person.id)}
                        onChange={() => toggleAssignment(item.id, person.id)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
