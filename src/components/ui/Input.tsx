import { forwardRef, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hideLabel?: boolean;
  error?: string | null;
}

const fieldStyles =
  "h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text " +
  "placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hideLabel = false, id, title, error, className = "", ...rest }, ref) => {
    const inputId = id ?? `input-${label.replace(/\s+/g, "-").toLowerCase()}`;
    const errorId = `${inputId}-error`;
    return (
      <div>
        <label htmlFor={inputId} className={hideLabel ? "sr-only" : "mb-1 block text-sm text-text-muted"}>
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          title={title ?? label}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={[fieldStyles, error && "border-danger focus-visible:ring-danger", className]
            .filter(Boolean)
            .join(" ")}
          {...rest}
        />
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
