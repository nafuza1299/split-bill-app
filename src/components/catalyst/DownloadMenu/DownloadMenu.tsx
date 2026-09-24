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
import { useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Button } from "../Button/Button";

export interface DownloadMenuItem {
  label: string;
  onSelect: () => void;
  icon?: ReactNode;
}

export interface DownloadMenuProps {
  items: DownloadMenuItem[];
  /** Accessible label for the trigger button. Defaults to "Download". */
  "aria-label"?: string;
}

/** An icon-only button that opens a small menu of download format choices (e.g. PNG / PDF / Excel). */
export function DownloadMenu({ items, "aria-label": ariaLabel = "Download" }: DownloadMenuProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const listRef = useRef<(HTMLElement | null)[]>([]);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "bottom-end",
    middleware: [offset(4), flip()],
    whileElementsMounted: autoUpdate,
  });
  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "menu" });
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

  return (
    <>
      <Button
        ref={refs.setReference}
        variant="secondary"
        size="sm"
        iconOnly
        aria-label={ariaLabel}
        {...getReferenceProps({
          // Stops the click from bubbling to an ancestor that opens/navigates on click
          // (e.g. an interactive Card row this menu sits inside).
          onClick: (e: MouseEvent) => e.stopPropagation(),
        })}
      >
        <DownloadIcon />
      </Button>
      {open && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <ul
              ref={refs.setFloating}
              style={floatingStyles}
              className="z-50 min-w-32 rounded-md border border-border bg-surface py-1 shadow-elevation"
              {...getFloatingProps({ onClick: (e: MouseEvent) => e.stopPropagation() })}
            >
              {items.map((item, index) => (
                <li
                  key={item.label}
                  ref={(node) => {
                    listRef.current[index] = node;
                  }}
                  role="menuitem"
                  tabIndex={index === activeIndex ? 0 : -1}
                  className={`flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-text outline-none ${
                    index === activeIndex ? "bg-surface-hover" : ""
                  }`}
                  {...getItemProps({
                    onClick: () => {
                      item.onSelect();
                      setOpen(false);
                    },
                  })}
                >
                  {item.icon}
                  {item.label}
                </li>
              ))}
            </ul>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

/** A small image/picture glyph, for a PNG menu item. */
export function PngIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

/** A small document glyph, for a PDF menu item. */
export function PdfIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

/** A small spreadsheet/table glyph, for an Excel menu item. */
export function ExcelIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </svg>
  );
}
