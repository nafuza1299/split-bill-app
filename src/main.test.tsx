import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

describe("main", () => {
  it(
    "mounts the app into #root and renders the top-level heading",
    async () => {
      document.body.innerHTML = '<div id="root"></div>';
      await import("./main");
      expect(await screen.findByRole("heading", { name: "Split Bill" })).toBeInTheDocument();
    },
    // HomePage now pulls in ExcelJS for the import/export flow, so the cold
    // import is noticeably heavier under full-suite parallel load than the
    // shared 15s default (it runs in ~1-2s standalone).
    30_000,
  );
});
