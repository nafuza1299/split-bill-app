import { Card } from "./catalyst/Card/Card";
import { useReceiptStore } from "../store/useReceiptStore";
import type { SplitMode } from "../lib/splitCalculator";

const options: { mode: SplitMode; title: string; description: string }[] = [
  { mode: "even", title: "Split evenly", description: "Divide the whole bill equally across everyone." },
  { mode: "assign", title: "Assign items", description: "Check off who owes what, item by item." },
];

export function SplitModeChooser() {
  const splitMode = useReceiptStore((s) => s.splitMode);
  const setSplitMode = useReceiptStore((s) => s.setSplitMode);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {options.map((option) => (
        <Card
          key={option.mode}
          interactive
          role="button"
          tabIndex={0}
          onClick={() => setSplitMode(option.mode)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setSplitMode(option.mode);
          }}
          className={splitMode === option.mode ? "border-primary bg-primary/5 ring-2 ring-primary" : ""}
        >
          <Card.Body>
            <div className="flex items-center justify-between">
              <Card.Title>{option.title}</Card.Title>
              {splitMode === option.mode && <span className="text-sm font-medium text-primary">Selected</span>}
            </div>
            <Card.Description>{option.description}</Card.Description>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}
