import { Button } from "./catalyst/Button/Button";
import { Tooltip } from "./catalyst/Tooltip/Tooltip";
import { ItemAssignmentGrid } from "./ItemAssignmentGrid";
import { PeopleManager } from "./PeopleManager";
import { ReceiptItemsEditor } from "./ReceiptItemsEditor";
import { SplitModeChooser } from "./SplitModeChooser";
import { SplitSummary } from "./SplitSummary";
import { StepBar } from "./StepBar";
import { useEntriesStore } from "../store/useEntriesStore";
import { canAdvance, getAdvanceBlockedReason, useReceiptStore } from "../store/useReceiptStore";

const stepComponents = {
  people: PeopleManager,
  items: ReceiptItemsEditor,
  mode: SplitModeChooser,
  assign: ItemAssignmentGrid,
  summary: SplitSummary,
};

export function SplitBillWizard() {
  const state = useReceiptStore();
  const goHome = useEntriesStore((s) => s.goHome);
  const StepComponent = stepComponents[state.step];
  const isFirstStep = state.step === "people";
  const isLastStep = state.step === "summary";

  const clearAll = () => {
    if (confirm("Clear everything you've entered?")) state.resetAll();
  };

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col gap-6 px-4 pt-10 pb-24">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={goHome}>
          ← Home
        </Button>
        <h1 className="text-2xl font-semibold text-text">Split Bill</h1>
        <Button variant="destructive" size="sm" onClick={clearAll}>
          Clear all
        </Button>
      </div>

      <StepComponent />

      <div className="flex items-center justify-between">
        {isFirstStep ? (
          <div />
        ) : (
          <Button variant="ghost" onClick={state.prevStep}>
            Back
          </Button>
        )}
        {!isLastStep && (() => {
          const nextButton = (
            <Button onClick={state.nextStep} disabled={!canAdvance(state.step, state)}>
              Next
            </Button>
          );
          const blockedReason = getAdvanceBlockedReason(state.step, state);
          if (!blockedReason) return nextButton;
          return (
            <Tooltip content={blockedReason}>
              <span>{nextButton}</span>
            </Tooltip>
          );
        })()}
      </div>

      <StepBar />
    </div>
  );
}
