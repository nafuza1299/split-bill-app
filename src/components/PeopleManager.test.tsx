import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PeopleManager } from "./PeopleManager";
import { useReceiptStore } from "../store/useReceiptStore";
import { alice } from "../test/fixtures";

describe("PeopleManager", () => {
  it("hides the column header when there are no people", () => {
    render(<PeopleManager />);
    expect(screen.queryByText("Name")).not.toBeInTheDocument();
  });

  it("shows the column header when there are people", () => {
    useReceiptStore.setState({ people: [alice] });
    render(<PeopleManager />);
    expect(screen.getByText("Name")).toBeInTheDocument();
  });

  it("shows a wildcard error for an invalid person name", () => {
    useReceiptStore.setState({ people: [{ id: "p1", name: "Ali*ce" }] });
    render(<PeopleManager />);
    expect(screen.getByRole("alert")).toHaveTextContent("No * ? % _ allowed");
  });

  it("shows a duplicate error when two people share a name (case-insensitive)", () => {
    useReceiptStore.setState({
      people: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "alice" },
      ],
    });
    render(<PeopleManager />);
    expect(screen.getAllByRole("alert")).toHaveLength(2);
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent("This name is already used");
  });

  it("shows no error for a valid, unique name", () => {
    useReceiptStore.setState({ people: [alice] });
    render(<PeopleManager />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("removes a person on click of the remove button", () => {
    useReceiptStore.setState({ people: [alice] });
    render(<PeopleManager />);
    fireEvent.click(screen.getByRole("button", { name: "Remove Alice" }));
    expect(useReceiptStore.getState().people).toHaveLength(0);
  });

  it("renames a person via the row input", () => {
    useReceiptStore.setState({ people: [alice] });
    render(<PeopleManager />);
    fireEvent.change(screen.getAllByLabelText("Person name")[0], { target: { value: "Alicia" } });
    expect(useReceiptStore.getState().people[0].name).toBe("Alicia");
  });

  it("shows no draft error while the new-person field is empty", () => {
    render(<PeopleManager />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a wildcard error while typing an invalid draft name", () => {
    render(<PeopleManager />);
    fireEvent.change(screen.getByLabelText("New person name"), { target: { value: "Bo*b" } });
    expect(screen.getByRole("alert")).toHaveTextContent("No * ? % _ allowed");
  });

  it("shows a duplicate error when the draft name matches an existing person", () => {
    useReceiptStore.setState({ people: [alice] });
    render(<PeopleManager />);
    fireEvent.change(screen.getByLabelText("New person name"), { target: { value: "alice" } });
    expect(screen.getByRole("alert")).toHaveTextContent("This name is already used");
  });

  it("adds the person and clears the draft field on Add click with a valid unique name", () => {
    render(<PeopleManager />);
    fireEvent.change(screen.getByLabelText("New person name"), { target: { value: "Alice" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(useReceiptStore.getState().people.map((p) => p.name)).toEqual(["Alice"]);
    expect(screen.getByLabelText("New person name")).toHaveValue("");
  });

  it("adds the person on Enter keydown in the draft field", () => {
    render(<PeopleManager />);
    const draft = screen.getByLabelText("New person name");
    fireEvent.change(draft, { target: { value: "Bob" } });
    fireEvent.keyDown(draft, { key: "Enter" });
    expect(useReceiptStore.getState().people.map((p) => p.name)).toEqual(["Bob"]);
  });

  it("does not add a person when the draft name is empty", () => {
    render(<PeopleManager />);
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(useReceiptStore.getState().people).toHaveLength(0);
  });

  it("does not add a person when the draft name duplicates an existing one", () => {
    useReceiptStore.setState({ people: [alice] });
    render(<PeopleManager />);
    fireEvent.change(screen.getByLabelText("New person name"), { target: { value: "alice" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(useReceiptStore.getState().people).toHaveLength(1);
  });

  it("sets receipt name and date via their inputs", () => {
    render(<PeopleManager />);
    fireEvent.change(screen.getByLabelText("Receipt name"), { target: { value: "Joe's Diner" } });
    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2026-08-23" } });
    expect(useReceiptStore.getState().receiptName).toBe("Joe's Diner");
    expect(useReceiptStore.getState().receiptDate).toBe("2026-08-23");
  });
});
