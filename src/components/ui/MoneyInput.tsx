import { useState } from "react";
import { formatCentsToDollars, parseDollarsToCents } from "../../lib/money";

export interface MoneyInputProps {
  label: string;
  hideLabel?: boolean;
  valueCents: number;
  onChangeCents: (cents: number) => void;
  className?: string;
  placeholder?: string;
}

const fieldStyles =
  "h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text " +
  "placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

export function MoneyInput({
  label,
  hideLabel = false,
  valueCents,
  onChangeCents,
  className = "",
  placeholder = "0.00",
}: MoneyInputProps) {
  const [text, setText] = useState(() => formatCentsToDollars(valueCents));
  const inputId = `money-input-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div>
      <label htmlFor={inputId} className={hideLabel ? "sr-only" : "mb-1 block text-sm text-text-muted"}>
        {label}
      </label>
      <input
        id={inputId}
        title={label}
        inputMode="decimal"
        placeholder={placeholder}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChangeCents(parseDollarsToCents(e.target.value));
        }}
        className={[fieldStyles, className].filter(Boolean).join(" ")}
      />
    </div>
  );
}
