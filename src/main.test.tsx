import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

describe("main", () => {
  it("mounts the app into #root and renders the top-level heading", async () => {
    document.body.innerHTML = '<div id="root"></div>';
    await import("./main");
    expect(await screen.findByRole("heading", { name: "Split Bill" })).toBeInTheDocument();
  });
});
