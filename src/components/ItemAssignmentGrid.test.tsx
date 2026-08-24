import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ItemAssignmentGrid } from "./ItemAssignmentGrid";
import { useReceiptStore } from "../store/useReceiptStore";

describe("ItemAssignmentGrid", () => {
  it("shows a — fallback for a person with no name and the name for others", () => {
    useReceiptStore.setState({
      people: [
        { id: "p1", name: "" },
        { id: "p2", name: "Bob" },
      ],
      items: [{ id: "i1", name: "Pizza", quantity: 1, unitPriceCents: 2000 }],
    });
    render(<ItemAssignmentGrid />);
    const table = screen.getByRole("table");
    expect(within(table).getByText("—")).toBeInTheDocument();
    expect(within(table).getByText("Bob")).toBeInTheDocument();
  });

  it("shows an Untitled item fallback for an item with no name and the name for others", () => {
    useReceiptStore.setState({
      people: [{ id: "p1", name: "Alice" }],
      items: [
        { id: "i1", name: "", quantity: 1, unitPriceCents: 2000 },
        { id: "i2", name: "Coffee", quantity: 1, unitPriceCents: 500 },
      ],
    });
    render(<ItemAssignmentGrid />);
    const table = screen.getByRole("table");
    expect(within(table).getByText("Untitled item")).toBeInTheDocument();
    expect(within(table).getByText("Coffee")).toBeInTheDocument();
  });

  it("renders an unchecked box when nobody is assigned to the item yet", () => {
    useReceiptStore.setState({
      people: [{ id: "p1", name: "Alice" }],
      items: [{ id: "i1", name: "Pizza", quantity: 1, unitPriceCents: 2000 }],
    });
    render(<ItemAssignmentGrid />);
    expect(screen.getByRole("checkbox", { name: "Alice had Pizza" })).not.toBeChecked();
  });

  it("toggles a person's assignment on checkbox click", () => {
    useReceiptStore.setState({
      people: [{ id: "p1", name: "Alice" }],
      items: [{ id: "i1", name: "Pizza", quantity: 1, unitPriceCents: 2000 }],
    });
    render(<ItemAssignmentGrid />);
    const checkbox = screen.getByRole("checkbox", { name: "Alice had Pizza" });
    fireEvent.click(checkbox);
    expect(useReceiptStore.getState().assignments.i1).toEqual(["p1"]);
    expect(checkbox).toBeChecked();
  });
});
