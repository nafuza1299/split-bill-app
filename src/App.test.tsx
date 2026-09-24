import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";
import { useEntriesStore } from "./store/useEntriesStore";

describe("App", () => {
  it("shows Home by default", () => {
    render(<App />);
    expect(screen.getByText("+ New split bill")).toBeInTheDocument();
  });

  it("switches to the wizard when a new entry is created", () => {
    render(<App />);
    fireEvent.click(screen.getByText("+ New split bill"));
    expect(screen.getByText("Who's splitting the bill?")).toBeInTheDocument();
  });

  it("returns Home when the wizard's Home button is clicked", () => {
    render(<App />);
    fireEvent.click(screen.getByText("+ New split bill"));
    fireEvent.click(screen.getByRole("button", { name: "Home" }));
    expect(useEntriesStore.getState().view).toBe("home");
    expect(screen.getByText("+ New split bill")).toBeInTheDocument();
  });
});
