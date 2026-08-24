import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MoneyInput } from "./MoneyInput";

describe("MoneyInput", () => {
  it("formats the initial valueCents with thousands separators", () => {
    render(<MoneyInput label="Unit price" valueCents={123456} onChangeCents={vi.fn()} />);
    expect(screen.getByLabelText("Unit price")).toHaveValue("1,234.56");
  });

  it("calls onChangeCents with parsed cents when typing a valid value", () => {
    const onChangeCents = vi.fn();
    render(<MoneyInput label="Unit price" valueCents={0} onChangeCents={onChangeCents} />);
    fireEvent.change(screen.getByLabelText("Unit price"), { target: { value: "12.5" } });
    expect(onChangeCents).toHaveBeenCalledWith(1250);
    expect(screen.getByLabelText("Unit price")).toHaveValue("12.5");
  });

  it("ignores a keystroke that produces invalid money text", () => {
    const onChangeCents = vi.fn();
    render(<MoneyInput label="Unit price" valueCents={0} onChangeCents={onChangeCents} />);
    fireEvent.change(screen.getByLabelText("Unit price"), { target: { value: "12.5.6" } });
    expect(onChangeCents).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Unit price")).toHaveValue("0.00");
  });

  it("shows no error state by default", () => {
    render(<MoneyInput label="Unit price" valueCents={0} onChangeCents={vi.fn()} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the error message when error is set", () => {
    render(<MoneyInput label="Unit price" valueCents={0} onChangeCents={vi.fn()} error="Must be zero or more" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Must be zero or more");
    expect(screen.getByLabelText("Unit price")).toHaveAttribute("aria-invalid", "true");
  });
});
