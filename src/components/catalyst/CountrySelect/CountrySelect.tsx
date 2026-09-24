import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingPortal,
  offset,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useListNavigation,
  useRole,
} from "@floating-ui/react";
import { useRef, useState } from "react";
import { countriesByName } from "../../../lib/countryCodes";

export interface CountrySelectProps {
  /** Selected ISO 3166-1 alpha-2 region code. */
  value: string;
  onChange: (iso2: string) => void;
  label: string;
  id: string;
}

function Flag({ iso2 }: { iso2: string }) {
  return <span aria-hidden="true" className={`fi fi-${iso2.toLowerCase()} rounded-sm`} />;
}

/** A country picker showing a real flag icon per option (native <select> can't render icons, and flag emoji don't render on Windows). */
export function CountrySelect({ value, onChange, label, id }: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const listRef = useRef<(HTMLElement | null)[]>([]);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "bottom-start",
    middleware: [offset(4), flip()],
    whileElementsMounted: autoUpdate,
  });
  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "listbox" });
  const listNav = useListNavigation(context, {
    listRef,
    activeIndex,
    onNavigate: setActiveIndex,
    loop: true,
  });
  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    click,
    dismiss,
    role,
    listNav,
  ]);

  const selected = countriesByName.find((c) => c.iso2 === value);

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-text-muted">
        {label}
      </label>
      <button
        id={id}
        ref={refs.setReference}
        type="button"
        className="flex h-10 w-56 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        aria-label={`${label}: ${selected?.name ?? value}`}
        {...getReferenceProps()}
      >
        <Flag iso2={value} />
        <span className="truncate">{selected?.name ?? value}</span>
      </button>
      {open && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <ul
              ref={refs.setFloating}
              style={floatingStyles}
              className="z-50 max-h-72 w-56 overflow-y-auto rounded-md border border-border bg-surface py-1 shadow-elevation"
              {...getFloatingProps()}
            >
              {countriesByName.map((c, index) => (
                <li
                  key={c.iso2}
                  ref={(node) => {
                    listRef.current[index] = node;
                  }}
                  role="option"
                  aria-selected={c.iso2 === value}
                  tabIndex={index === activeIndex ? 0 : -1}
                  className={`flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-text outline-none ${
                    index === activeIndex ? "bg-surface-hover" : ""
                  }`}
                  {...getItemProps({
                    onClick: () => {
                      onChange(c.iso2);
                      setOpen(false);
                    },
                  })}
                >
                  <Flag iso2={c.iso2} />
                  <span className="truncate">{c.name}</span>
                </li>
              ))}
            </ul>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </div>
  );
}
