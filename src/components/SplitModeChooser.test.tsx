import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SplitModeChooser } from "./SplitModeChooser";
import { useReceiptStore } from "../store/useReceiptStore";

describe("SplitModeChooser", () => {
  it("shows neither tile as selected when splitMode is null", () => {
    render(<SplitModeChooser />);
    expect(screen.queryByText("Selected")).not.toBeInTheDocument();
  });

  it("shows the even tile as selected and assign as not, when splitMode is even", () => {
    useReceiptStore.setState({ splitMode: "even" });
    render(<SplitModeChooser />);
    expect(screen.getAllByText("Selected")).toHaveLength(1);
    const evenTile = screen.getByText("Split evenly").closest('[role="button"]');
    expect(evenTile).toHaveTextContent("Selected");
  });

  it("calls setSplitMode on click", () => {
    render(<SplitModeChooser />);
    fireEvent.click(screen.getByText("Assign items"));
    expect(useReceiptStore.getState().splitMode).toBe("assign");
  });

  it("calls setSplitMode on Enter keydown", () => {
    render(<SplitModeChooser />);
    fireEvent.keyDown(screen.getByText("Split evenly").closest('[role="button"]')!, { key: "Enter" });
    expect(useReceiptStore.getState().splitMode).toBe("even");
  });

  it("calls setSplitMode on Space keydown", () => {
    render(<SplitModeChooser />);
    fireEvent.keyDown(screen.getByText("Assign items").closest('[role="button"]')!, { key: " " });
    expect(useReceiptStore.getState().splitMode).toBe("assign");
  });

  it("does nothing on an unrelated keydown", () => {
    render(<SplitModeChooser />);
    fireEvent.keyDown(screen.getByText("Split evenly").closest('[role="button"]')!, { key: "Tab" });
    expect(useReceiptStore.getState().splitMode).toBeNull();
  });
});
