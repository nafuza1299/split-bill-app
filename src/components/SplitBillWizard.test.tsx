import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SplitBillWizard } from "./SplitBillWizard";
import { ThemeProvider } from "./catalyst/theme/ThemeProvider";
import { useEntriesStore } from "../store/useEntriesStore";
import { useReceiptStore } from "../store/useReceiptStore";
import { twoPeople } from "../test/fixtures";

describe("SplitBillWizard", () => {
  it("renders the People step by default and hides the Back button", () => {
    render(<ThemeProvider><SplitBillWizard /></ThemeProvider>);
    expect(screen.getByText("Who's splitting the bill?")).toBeInTheDocument();
    expect(screen.queryByText("Back")).not.toBeInTheDocument();
  });

  it("shows the Back button on a non-first step", () => {
    useReceiptStore.setState({ step: "items" });
    render(<ThemeProvider><SplitBillWizard /></ThemeProvider>);
    expect(screen.getByText("Back")).toBeInTheDocument();
  });

  it("hides the Next button on the summary step", () => {
    useReceiptStore.setState({ step: "summary" });
    render(<ThemeProvider><SplitBillWizard /></ThemeProvider>);
    expect(screen.queryByText("Next")).not.toBeInTheDocument();
  });

  it("shows the Next button on a non-last step", () => {
    render(<ThemeProvider><SplitBillWizard /></ThemeProvider>);
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  it("disables Next when canAdvance is false", () => {
    render(<ThemeProvider><SplitBillWizard /></ThemeProvider>);
    expect(screen.getByText("Next")).toBeDisabled();
  });

  it("enables Next when canAdvance is true", () => {
    useReceiptStore.setState({ people: twoPeople });
    render(<ThemeProvider><SplitBillWizard /></ThemeProvider>);
    expect(screen.getByText("Next")).not.toBeDisabled();
  });

  it("calls nextStep/prevStep on button click", () => {
    useReceiptStore.setState({ people: twoPeople });
    render(<ThemeProvider><SplitBillWizard /></ThemeProvider>);
    fireEvent.click(screen.getByText("Next"));
    expect(useReceiptStore.getState().step).toBe("items");
    fireEvent.click(screen.getByText("Back"));
    expect(useReceiptStore.getState().step).toBe("people");
  });

  describe("Clear all", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("resets state when the user confirms", () => {
      useReceiptStore.setState({ people: twoPeople });
      vi.spyOn(window, "confirm").mockReturnValue(true);
      render(<ThemeProvider><SplitBillWizard /></ThemeProvider>);
      fireEvent.click(screen.getByText("Clear all"));
      expect(useReceiptStore.getState().people).toHaveLength(0);
    });

    it("leaves state untouched when the user cancels", () => {
      useReceiptStore.setState({ people: twoPeople });
      vi.spyOn(window, "confirm").mockReturnValue(false);
      render(<ThemeProvider><SplitBillWizard /></ThemeProvider>);
      fireEvent.click(screen.getByText("Clear all"));
      expect(useReceiptStore.getState().people).toEqual(twoPeople);
    });
  });

  it("returns to Home via the Home button", () => {
    render(<ThemeProvider><SplitBillWizard /></ThemeProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Home" }));
    expect(useEntriesStore.getState().view).toBe("home");
  });
});
