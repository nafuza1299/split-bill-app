import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  it("renders unchecked", () => {
    render(<Checkbox checked={false} onChange={vi.fn()} ariaLabel="Alice had Pizza" />);
    expect(screen.getByRole("checkbox", { name: "Alice had Pizza" })).not.toBeChecked();
  });

  it("renders checked when checked=true", () => {
    render(<Checkbox checked={true} onChange={vi.fn()} ariaLabel="Alice had Pizza" />);
    expect(screen.getByRole("checkbox", { name: "Alice had Pizza" })).toBeChecked();
  });

  it("calls onChange with the new checked value on click", () => {
    const onChange = vi.fn();
    render(<Checkbox checked={false} onChange={onChange} ariaLabel="Alice had Pizza" />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Alice had Pizza" }));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
