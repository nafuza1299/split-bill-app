import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CountrySelect } from "./CountrySelect";

describe("CountrySelect", () => {
  it("shows the selected country on the trigger", () => {
    render(<CountrySelect id="region" label="Region" value="US" onChange={vi.fn()} />);
    expect(screen.getByRole("combobox", { name: /United States/ })).toBeInTheDocument();
  });

  it("opens a listbox of countries on click", () => {
    render(<CountrySelect id="region" label="Region" value="US" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("combobox", { name: /United States/ }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Japan/ })).toBeInTheDocument();
  });

  it("calls onChange with the picked country and closes the listbox", () => {
    const onChange = vi.fn();
    render(<CountrySelect id="region" label="Region" value="US" onChange={onChange} />);
    fireEvent.click(screen.getByRole("combobox", { name: /United States/ }));
    fireEvent.click(screen.getByRole("option", { name: /Japan/ }));
    expect(onChange).toHaveBeenCalledWith("JP");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
