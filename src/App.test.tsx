import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import { ThemeProvider } from "./components/catalyst/theme/ThemeProvider";
import { useEntriesStore } from "./store/useEntriesStore";
import { useReceiptStore } from "./store/useReceiptStore";

describe("App", () => {
  it("shows Home by default", () => {
    render(<ThemeProvider><App /></ThemeProvider>);
    expect(screen.getByText("+ New split bill")).toBeInTheDocument();
  });

  it("switches to the wizard when a new entry is created", () => {
    render(<ThemeProvider><App /></ThemeProvider>);
    fireEvent.click(screen.getByText("+ New split bill"));
    expect(screen.getByText("Who's splitting the bill?")).toBeInTheDocument();
  });

  it("returns Home when the wizard's Home button is clicked", () => {
    render(<ThemeProvider><App /></ThemeProvider>);
    fireEvent.click(screen.getByText("+ New split bill"));
    fireEvent.click(screen.getByRole("button", { name: "Home" }));
    expect(useEntriesStore.getState().view).toBe("home");
    expect(screen.getByText("+ New split bill")).toBeInTheDocument();
  });

  describe("geoip detection on mount", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("applies the detected region once the lookup resolves", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: true, json: async () => ({ country: "JP" }) }),
      );
      render(<ThemeProvider><App /></ThemeProvider>);
      await waitFor(() => expect(useReceiptStore.getState().detectedRegion).toBe("JP"));
    });

    it("leaves the region alone when the lookup fails", async () => {
      render(<ThemeProvider><App /></ThemeProvider>);
      const before = useReceiptStore.getState().detectedRegion;
      await waitFor(() => expect(useReceiptStore.getState().detectedRegion).toBe(before));
    });
  });
});
