import { forwardRef, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hideLabel?: boolean;
}

const fieldStyles =
  "h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text " +
  "placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hideLabel = false, id, title, className = "", ...rest }, ref) => {
    const inputId = id ?? `input-${label.replace(/\s+/g, "-").toLowerCase()}`;
    return (
      <div>
        <label htmlFor={inputId} className={hideLabel ? "sr-only" : "mb-1 block text-sm text-text-muted"}>
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          title={title ?? label}
          className={[fieldStyles, className].filter(Boolean).join(" ")}
          {...rest}
        />
      </div>
    );
  },
);

Input.displayName = "Input";
