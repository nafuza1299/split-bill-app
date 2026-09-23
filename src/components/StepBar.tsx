import { useState } from "react";
import { Button } from "./catalyst/Button/Button";
import { Card } from "./catalyst/Card/Card";
import { Modal } from "./catalyst/Modal/Modal";
import { useReceiptStore } from "../store/useReceiptStore";
import type { WizardStep } from "../store/useReceiptStore";

const ALL_STEPS: WizardStep[] = ["people", "items", "mode", "assign", "summary"];

const STEP_LABELS: Record<WizardStep, string> = {
  people: "People",
  items: "Items",
  mode: "Mode",
  assign: "Assign",
  summary: "Summary",
};

/** Bottom-pinned step indicator. Jump to any visited step; confirms non-adjacent jumps. */
export function StepBar() {
  const { step, splitMode, visitedSteps, goToStep } = useReceiptStore();
  const [pendingStep, setPendingStep] = useState<WizardStep | null>(null);

  const displaySteps = splitMode === "assign" ? ALL_STEPS : ALL_STEPS.filter((s) => s !== "assign");

  function handleStepClick(target: WizardStep) {
    if (target === step) return;
    const currentIndex = displaySteps.indexOf(step);
    const targetIndex = displaySteps.indexOf(target);
    if (Math.abs(targetIndex - currentIndex) === 1) goToStep(target);
    else setPendingStep(target);
  }

  return (
    <>
      <nav aria-label="Wizard steps" className="fixed inset-x-0 bottom-0 z-40 bg-bg">
        <ol className="mx-auto flex max-w-2xl items-start px-4 py-3">
          {displaySteps.map((s, i) => {
            const isCurrent = s === step;
            const isVisited = visitedSteps.includes(s);
            const clickable = isCurrent || isVisited;
            const circleClasses = isCurrent
              ? "bg-primary text-primary-fg border-primary"
              : isVisited
                ? "border-2 border-primary text-primary bg-bg"
                : "border border-border text-text-muted bg-bg";
            return (
              <li
                key={s}
                className={`flex items-start ${i < displaySteps.length - 1 ? "flex-1" : ""}`}
              >
                <button
                  type="button"
                  disabled={!clickable}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`Step ${i + 1}: ${STEP_LABELS[s]}`}
                  onClick={() => handleStepClick(s)}
                  className="flex flex-col items-center gap-1.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none"
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${circleClasses}`}
                  >
                    {i + 1}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`text-xs ${isCurrent ? "font-medium text-primary" : "text-text-muted"}`}
                  >
                    {STEP_LABELS[s]}
                  </span>
                </button>
                {i < displaySteps.length - 1 && (
                  <div
                    aria-hidden="true"
                    className={`mt-3 h-0.5 flex-1 ${
                      visitedSteps.includes(displaySteps[i + 1]) ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <Modal
        open={pendingStep !== null}
        onClose={() => setPendingStep(null)}
        aria-label="Confirm step change"
      >
        <Card>
          <Card.Body>
            <p className="text-sm text-text">
              Jump to "{pendingStep && STEP_LABELS[pendingStep]}"? You can come back to finish the
              steps in between.
            </p>
          </Card.Body>
          <Card.Footer>
            <Button variant="ghost" onClick={() => setPendingStep(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (pendingStep) goToStep(pendingStep);
                setPendingStep(null);
              }}
            >
              Continue
            </Button>
          </Card.Footer>
        </Card>
      </Modal>
    </>
  );
}
