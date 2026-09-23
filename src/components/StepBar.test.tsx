import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { StepBar } from "./StepBar";
import { useReceiptStore } from "../store/useReceiptStore";

describe("StepBar", () => {
  it("renders 4 numbered steps when split mode is not assign", () => {
    render(<StepBar />);
    expect(screen.getByRole("button", { name: "Step 1: People" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Step 2: Items" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Step 3: Mode" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Step 4: Summary" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Assign/ })).not.toBeInTheDocument();
  });

  it("renders 5 numbered steps when split mode is assign", () => {
    useReceiptStore.setState({ splitMode: "assign" });
    render(<StepBar />);
    expect(screen.getByRole("button", { name: "Step 4: Assign" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Step 5: Summary" })).toBeInTheDocument();
  });

  it("marks the current step with aria-current", () => {
    useReceiptStore.setState({ step: "items", visitedSteps: ["people", "items"] });
    render(<StepBar />);
    expect(screen.getByRole("button", { name: "Step 2: Items" })).toHaveAttribute("aria-current", "step");
  });

  it("disables a step that has not been visited", () => {
    render(<StepBar />);
    expect(screen.getByRole("button", { name: "Step 3: Mode" })).toBeDisabled();
  });

  it("navigates immediately when clicking an adjacent visited step, without a modal", () => {
    useReceiptStore.setState({ step: "items", visitedSteps: ["people", "items"] });
    render(<StepBar />);
    fireEvent.click(screen.getByRole("button", { name: "Step 1: People" }));
    expect(useReceiptStore.getState().step).toBe("people");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens a confirm modal for a non-adjacent visited step, and only navigates on confirm", () => {
    useReceiptStore.setState({
      step: "summary",
      visitedSteps: ["people", "items", "mode", "summary"],
    });
    render(<StepBar />);
    fireEvent.click(screen.getByRole("button", { name: "Step 1: People" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(useReceiptStore.getState().step).toBe("summary");

    fireEvent.click(screen.getByText("Continue"));
    expect(useReceiptStore.getState().step).toBe("people");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("cancelling the confirm modal leaves the step unchanged", () => {
    useReceiptStore.setState({
      step: "summary",
      visitedSteps: ["people", "items", "mode", "summary"],
    });
    render(<StepBar />);
    fireEvent.click(screen.getByRole("button", { name: "Step 1: People" }));
    fireEvent.click(screen.getByText("Cancel"));
    expect(useReceiptStore.getState().step).toBe("summary");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
