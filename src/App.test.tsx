import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";
import { useReceiptStore } from "./store/useReceiptStore";

describe("App", () => {
  it("renders the People step by default and hides the Back button", () => {
    render(<App />);
    expect(screen.getByText("Who's splitting the bill?")).toBeInTheDocument();
    expect(screen.queryByText("Back")).not.toBeInTheDocument();
  });

  it("shows the Back button on a non-first step", () => {
    useReceiptStore.setState({ step: "items" });
    render(<App />);
    expect(screen.getByText("Back")).toBeInTheDocument();
  });

  it("hides the Next button on the summary step", () => {
    useReceiptStore.setState({ step: "summary" });
    render(<App />);
    expect(screen.queryByText("Next")).not.toBeInTheDocument();
  });

  it("shows the Next button on a non-last step", () => {
    render(<App />);
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  it("disables Next when canAdvance is false", () => {
    render(<App />);
    expect(screen.getByText("Next")).toBeDisabled();
  });

  it("enables Next when canAdvance is true", () => {
    useReceiptStore.setState({
      people: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });
    render(<App />);
    expect(screen.getByText("Next")).not.toBeDisabled();
  });

  it("calls nextStep/prevStep on button click", () => {
    useReceiptStore.setState({
      people: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });
    render(<App />);
    fireEvent.click(screen.getByText("Next"));
    expect(useReceiptStore.getState().step).toBe("items");
    fireEvent.click(screen.getByText("Back"));
    expect(useReceiptStore.getState().step).toBe("people");
  });
});
