import {
  FloatingFocusManager,
  FloatingOverlay,
  FloatingPortal,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import type { ReactNode } from "react";

export interface ModalProps {
  /** Whether the modal is visible. */
  open: boolean;
  /** Called when the user dismisses the modal (backdrop click or Escape). */
  onClose: () => void;
  /** Accessible name for the dialog — required since content may have no heading. */
  "aria-label": string;
  children: ReactNode;
}

/** A centered, focus-trapping overlay. Compose with Card for content/actions. */
export function Modal({ open, onClose, "aria-label": ariaLabel, children }: ModalProps) {
  const { context, refs } = useFloating({
    open,
    onOpenChange: (next) => {
      if (!next) onClose();
    },
  });
  const dismiss = useDismiss(context, { outsidePressEvent: "mousedown" });
  const role = useRole(context, { role: "dialog" });
  const { getFloatingProps } = useInteractions([dismiss, role]);

  if (!open) return null;

  return (
    <FloatingPortal>
      <FloatingOverlay
        lockScroll
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <FloatingFocusManager context={context}>
          <div
            ref={refs.setFloating}
            aria-modal="true"
            aria-label={ariaLabel}
            onClick={(e) => e.stopPropagation()}
            {...getFloatingProps()}
          >
            {children}
          </div>
        </FloatingFocusManager>
      </FloatingOverlay>
    </FloatingPortal>
  );
}
