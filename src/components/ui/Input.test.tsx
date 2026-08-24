import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input } from "./Input";

describe("Input", () => {
  it("shows the visible label by default", () => {
    render(<Input label="Person name" value="" onChange={vi.fn()} />);
    expect(screen.getByLabelText("Person name")).toBeInTheDocument();
    expect(screen.getByText("Person name")).not.toHaveClass("sr-only");
  });

  it("visually hides the label when hideLabel is set", () => {
    render(<Input label="Person name" hideLabel value="" onChange={vi.fn()} />);
    expect(screen.getByText("Person name")).toHaveClass("sr-only");
  });

  it("derives the input id from the label when id is not provided", () => {
    render(<Input label="Person name" value="" onChange={vi.fn()} />);
    expect(screen.getByLabelText("Person name")).toHaveAttribute("id", "input-person-name");
  });

  it("uses the provided id when given", () => {
    render(<Input label="Person name" id="custom-id" value="" onChange={vi.fn()} />);
    expect(screen.getByLabelText("Person name")).toHaveAttribute("id", "custom-id");
  });

  it("falls back to the label as the title attribute", () => {
    render(<Input label="Person name" value="" onChange={vi.fn()} />);
    expect(screen.getByLabelText("Person name")).toHaveAttribute("title", "Person name");
  });

  it("uses the provided title when given", () => {
    render(<Input label="Person name" title="Custom title" value="" onChange={vi.fn()} />);
    expect(screen.getByLabelText("Person name")).toHaveAttribute("title", "Custom title");
  });

  it("shows no error state by default", () => {
    render(<Input label="Person name" value="" onChange={vi.fn()} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Person name")).not.toHaveAttribute("aria-invalid");
  });

  it("shows the error message and aria attributes when error is set", () => {
    render(<Input label="Person name" value="" error="No * ? % _ allowed" onChange={vi.fn()} />);
    const input = screen.getByLabelText("Person name");
    expect(screen.getByRole("alert")).toHaveTextContent("No * ? % _ allowed");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "input-person-name-error");
  });
});
