import { Button } from "./components/catalyst/Button/Button";
import { Tooltip } from "./components/catalyst/Tooltip/Tooltip";
import { ItemAssignmentGrid } from "./components/ItemAssignmentGrid";
import { PeopleManager } from "./components/PeopleManager";
import { ReceiptItemsEditor } from "./components/ReceiptItemsEditor";
import { SplitModeChooser } from "./components/SplitModeChooser";
import { SplitSummary } from "./components/SplitSummary";
import { canAdvance, getAdvanceBlockedReason, useReceiptStore } from "./store/useReceiptStore";

const stepComponents = {
  people: PeopleManager,
  items: ReceiptItemsEditor,
  mode: SplitModeChooser,
  assign: ItemAssignmentGrid,
  summary: SplitSummary,
};

export default function App() {
  const state = useReceiptStore();
  const StepComponent = stepComponents[state.step];
  const isFirstStep = state.step === "people";
  const isLastStep = state.step === "summary";

  const clearAll = () => {
    if (confirm("Clear everything you've entered?")) state.resetAll();
  };

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold text-text">Split Bill</h1>

      <StepComponent />

      <div className="flex items-center justify-between">
        {!isFirstStep && (
          <Button variant="ghost" onClick={state.prevStep}>
            Back
          </Button>
        )}
        {isFirstStep && (
          <Button variant="destructive" onClick={clearAll}>
            Clear all
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
    </div>
  );
}
