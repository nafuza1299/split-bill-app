import { useLayoutEffect, useRef, useState } from "react";
import {
  countDigitsBefore,
  formatCentsToDollars,
  formatWithThousandsSeparators,
  indexAfterDigits,
  isPartialMoneyText,
  parseDollarsToCents,
  stripCommas,
} from "../../lib/money";

export interface MoneyInputProps {
  label: string;
  hideLabel?: boolean;
  valueCents: number;
  onChangeCents: (cents: number) => void;
  className?: string;
  placeholder?: string;
  error?: string | null;
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
  error,
}: MoneyInputProps) {
  const [text, setText] = useState(() => formatWithThousandsSeparators(formatCentsToDollars(valueCents)));
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCursorRef = useRef<number | null>(null);
  const inputId = `money-input-${label.replace(/\s+/g, "-").toLowerCase()}`;
  const errorId = `${inputId}-error`;

  useLayoutEffect(() => {
    if (pendingCursorRef.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(pendingCursorRef.current, pendingCursorRef.current);
      pendingCursorRef.current = null;
    }
  }, [text]);

  return (
    <div>
      <label htmlFor={inputId} className={hideLabel ? "sr-only" : "mb-1 block text-sm text-text-muted"}>
        {label}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        title={label}
        inputMode="decimal"
        placeholder={placeholder}
        value={text}
        onChange={(e) => {
          const raw = stripCommas(e.target.value);
          if (!isPartialMoneyText(raw)) return;
          const digitsBeforeCursor = countDigitsBefore(e.target.value, e.target.selectionStart ?? e.target.value.length);
          const formatted = formatWithThousandsSeparators(raw);
          pendingCursorRef.current = indexAfterDigits(formatted, digitsBeforeCursor);
          setText(formatted);
          onChangeCents(parseDollarsToCents(raw));
        }}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={[fieldStyles, error && "border-danger focus-visible:ring-danger", className]
          .filter(Boolean)
          .join(" ")}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
