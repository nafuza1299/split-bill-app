import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ReceiptOcrUpload } from "./ReceiptOcrUpload";
import { useReceiptStore } from "../store/useReceiptStore";
import { resetReceiptStore } from "../test/resetStore";

const { recognizeMock, terminateMock, setParametersMock, createWorkerMock } = vi.hoisted(() => ({
  recognizeMock: vi.fn(),
  terminateMock: vi.fn(),
  setParametersMock: vi.fn(),
  createWorkerMock: vi.fn(),
}));

vi.mock("tesseract.js", () => ({
  createWorker: createWorkerMock,
  PSM: { SINGLE_COLUMN: "4" },
}));

function uploadFile(container: HTMLElement) {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(["x"], "receipt.jpg", { type: "image/jpeg" });
  fireEvent.change(input, { target: { files: [file] } });
}

describe("ReceiptOcrUpload", () => {
  beforeEach(() => {
    resetReceiptStore();
    recognizeMock.mockReset();
    terminateMock.mockReset();
    setParametersMock.mockReset();
    setParametersMock.mockResolvedValue(undefined);
    createWorkerMock.mockReset();
    createWorkerMock.mockResolvedValue({
      recognize: recognizeMock,
      terminate: terminateMock,
      setParameters: setParametersMock,
    });

    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockResolvedValue({ width: 10, height: 10 }),
    );
    const fakeContext = {
      drawImage: vi.fn(),
      getImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(400) }),
      putImageData: vi.fn(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(fakeContext as never);
  });

  it("adds parsed items to the store on a successful scan", async () => {
    recognizeMock.mockResolvedValue({ data: { text: "Coffee 4.50\nBagel 3.25" } });
    const { container } = render(<ReceiptOcrUpload />);

    uploadFile(container);

    await waitFor(() => expect(useReceiptStore.getState().items).toHaveLength(2));
    expect(useReceiptStore.getState().items[0]).toMatchObject({ name: "Coffee", unitPriceCents: 450 });
    expect(terminateMock).toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(setParametersMock).toHaveBeenCalledWith({
      tessedit_pageseg_mode: "4",
      preserve_interword_spaces: "1",
    });
    expect(recognizeMock).toHaveBeenCalledWith(expect.anything(), { rotateAuto: true });
  });

  it("shows an error when no items are found", async () => {
    recognizeMock.mockResolvedValue({ data: { text: "Thank you for shopping with us" } });
    const { container } = render(<ReceiptOcrUpload />);

    uploadFile(container);

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/couldn't find any items/i));
    expect(useReceiptStore.getState().items).toHaveLength(0);
  });

  it("shows an error when the scan throws", async () => {
    recognizeMock.mockRejectedValue(new Error("boom"));
    const { container } = render(<ReceiptOcrUpload />);

    uploadFile(container);

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/couldn't scan that image/i));
    expect(terminateMock).toHaveBeenCalled();
  });

  it("shows the button as loading while a scan is in progress", async () => {
    let resolveRecognize!: (value: { data: { text: string } }) => void;
    recognizeMock.mockReturnValue(new Promise((resolve) => (resolveRecognize = resolve)));
    const { container } = render(<ReceiptOcrUpload />);

    uploadFile(container);

    await waitFor(() => expect(screen.getByRole("button", { name: /scan receipt photo/i })).toBeDisabled());

    resolveRecognize({ data: { text: "Coffee 4.50" } });
    await waitFor(() => expect(screen.getByRole("button", { name: /scan receipt photo/i })).not.toBeDisabled());
  });
});
