import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ReceiptItemsEditor } from "./ReceiptItemsEditor";
import { useReceiptStore } from "../store/useReceiptStore";

describe("ReceiptItemsEditor", () => {
  it("hides the column header when there are no items", () => {
    render(<ReceiptItemsEditor />);
    expect(screen.queryByText("Item name")).not.toBeInTheDocument();
  });

  it("shows the column header when there are items", () => {
    useReceiptStore.setState({ items: [{ id: "i1", name: "Pizza", quantity: 1, unitPriceCents: 2000 }] });
    render(<ReceiptItemsEditor />);
    expect(screen.getByText("Qty")).toBeInTheDocument();
  });

  it("shows an invalid-name error for a bad item name", () => {
    useReceiptStore.setState({ items: [{ id: "i1", name: "Pi*zza", quantity: 1, unitPriceCents: 2000 }] });
    render(<ReceiptItemsEditor />);
    expect(screen.getByText("No * ? % _ allowed")).toBeInTheDocument();
  });

  it("shows a duplicate-name error for two items sharing a name", () => {
    useReceiptStore.setState({
      items: [
        { id: "i1", name: "Pizza", quantity: 1, unitPriceCents: 2000 },
        { id: "i2", name: "pizza", quantity: 1, unitPriceCents: 500 },
      ],
    });
    render(<ReceiptItemsEditor />);
    expect(screen.getAllByText("This name is already used")).toHaveLength(2);
  });

  it("shows a quantity error for an invalid quantity", () => {
    useReceiptStore.setState({ items: [{ id: "i1", name: "Pizza", quantity: 1.5, unitPriceCents: 2000 }] });
    render(<ReceiptItemsEditor />);
    expect(screen.getByText("Must be a whole number")).toBeInTheDocument();
  });

  it("shows a money error for a negative unit price", () => {
    useReceiptStore.setState({ items: [{ id: "i1", name: "Pizza", quantity: 1, unitPriceCents: -100 }] });
    render(<ReceiptItemsEditor />);
    expect(screen.getByText("Must be zero or more")).toBeInTheDocument();
  });

  it("adds a new blank item on Add item click", () => {
    render(<ReceiptItemsEditor />);
    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    expect(useReceiptStore.getState().items).toHaveLength(1);
  });

  it("removes an item on click of its remove button", () => {
    useReceiptStore.setState({ items: [{ id: "i1", name: "Pizza", quantity: 1, unitPriceCents: 2000 }] });
    render(<ReceiptItemsEditor />);
    fireEvent.click(screen.getByRole("button", { name: "Remove Pizza" }));
    expect(useReceiptStore.getState().items).toHaveLength(0);
  });

  it("updates quantity to a valid number", () => {
    useReceiptStore.setState({ items: [{ id: "i1", name: "Pizza", quantity: 1, unitPriceCents: 2000 }] });
    render(<ReceiptItemsEditor />);
    fireEvent.change(screen.getAllByLabelText("Quantity")[0], { target: { value: "3" } });
    expect(useReceiptStore.getState().items[0].quantity).toBe(3);
  });

  it("falls back quantity to 1 for a non-numeric value", () => {
    useReceiptStore.setState({ items: [{ id: "i1", name: "Pizza", quantity: 5, unitPriceCents: 2000 }] });
    render(<ReceiptItemsEditor />);
    fireEvent.change(screen.getAllByLabelText("Quantity")[0], { target: { value: "" } });
    expect(useReceiptStore.getState().items[0].quantity).toBe(1);
  });

  it("updates the unit price via its MoneyInput", () => {
    useReceiptStore.setState({ items: [{ id: "i1", name: "Pizza", quantity: 1, unitPriceCents: 0 }] });
    render(<ReceiptItemsEditor />);
    fireEvent.change(screen.getAllByLabelText("Unit price")[0], { target: { value: "20.00" } });
    expect(useReceiptStore.getState().items[0].unitPriceCents).toBe(2000);
  });

  it("updates tax and service charge via their MoneyInputs", () => {
    render(<ReceiptItemsEditor />);
    fireEvent.change(screen.getByLabelText("Tax"), { target: { value: "2.50" } });
    fireEvent.change(screen.getByLabelText("Service charge"), { target: { value: "1.00" } });
    expect(useReceiptStore.getState().taxCents).toBe(250);
    expect(useReceiptStore.getState().serviceCents).toBe(100);
  });
});
