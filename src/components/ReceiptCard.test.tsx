import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReceiptCard } from "./ReceiptCard";
import { useReceiptStore } from "../store/useReceiptStore";

describe("ReceiptCard", () => {
  it("shows a Receipt fallback title when receiptName is empty", () => {
    render(<ReceiptCard />);
    expect(screen.getByText("Receipt")).toBeInTheDocument();
  });

  it("shows the receipt name when set", () => {
    useReceiptStore.setState({ receiptName: "Joe's Diner" });
    render(<ReceiptCard />);
    expect(screen.getByText("Joe's Diner")).toBeInTheDocument();
  });

  it("hides the date line when receiptDate is empty", () => {
    render(<ReceiptCard />);
    expect(screen.queryByText(/\d{1,2}\/\d{1,2}\/\d{4}/)).not.toBeInTheDocument();
  });

  it("shows the formatted date when receiptDate is set", () => {
    useReceiptStore.setState({ receiptDate: "2026-08-23" });
    render(<ReceiptCard />);
    expect(screen.getByText(new Date("2026-08-23").toLocaleDateString())).toBeInTheDocument();
  });

  it("shows fallback and real names for items, and the subtotal/tax/service/total", () => {
    useReceiptStore.setState({
      items: [
        { id: "i1", name: "", quantity: 1, unitPriceCents: 2000 },
        { id: "i2", name: "Coffee", quantity: 2, unitPriceCents: 500 },
      ],
      taxCents: 250,
      serviceCents: 100,
    });
    render(<ReceiptCard />);
    expect(screen.getByText("Untitled item")).toBeInTheDocument();
    expect(screen.getByText(/Coffee/)).toBeInTheDocument();
    expect(screen.getByText("$30.00")).toBeInTheDocument(); // subtotal
    expect(screen.getByText("$2.50")).toBeInTheDocument(); // tax
    expect(screen.getByText("$1.00")).toBeInTheDocument(); // service
    expect(screen.getByText("$33.50")).toBeInTheDocument(); // total
  });
});
