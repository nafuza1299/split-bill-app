import { useRef, useState } from "react";
import { createWorker, PSM } from "tesseract.js";
import { Button } from "./catalyst/Button/Button";
import { parseReceiptText } from "../lib/receiptOcr";
import { findReceiptBounds, grayscaleAndContrast } from "../lib/receiptImagePreprocess";
import { useReceiptStore } from "../store/useReceiptStore";

const NO_ITEMS_MESSAGE = "Couldn't find any items on that receipt. Try a clearer photo or add items manually.";
const SCAN_FAILED_MESSAGE = "Couldn't scan that image. Try a clearer photo or add items manually.";

function drawToCanvas(bitmap: ImageBitmap, sx: number, sy: number, sw: number, sh: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvas;
}

async function preprocessImage(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);
  const fullCanvas = drawToCanvas(bitmap, 0, 0, bitmap.width, bitmap.height);
  const fullCtx = fullCanvas.getContext("2d")!;
  const fullImageData = fullCtx.getImageData(0, 0, bitmap.width, bitmap.height);
  const bounds = findReceiptBounds(fullImageData.data, bitmap.width, bitmap.height);

  const canvas = bounds ? drawToCanvas(bitmap, bounds.x, bounds.y, bounds.width, bounds.height) : fullCanvas;
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  grayscaleAndContrast(imageData.data);
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function ReceiptOcrUpload() {
  const addItemsFromOcr = useReceiptStore((s) => s.addItemsFromOcr);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setScanning(true);
    try {
      const canvas = await preprocessImage(file);
      const worker = await createWorker("eng");
      try {
        await worker.setParameters({
          tessedit_pageseg_mode: PSM.SINGLE_COLUMN,
          preserve_interword_spaces: "1",
        });
        const { data } = await worker.recognize(canvas, { rotateAuto: true });
        if (import.meta.env.DEV) console.log("OCR raw text:", data.text);
        const items = parseReceiptText(data.text);
        if (items.length === 0) {
          setError(NO_ITEMS_MESSAGE);
          return;
        }
        addItemsFromOcr(items);
      } finally {
        await worker.terminate();
      }
    } catch (err) {
      console.error("Receipt scan failed", err);
      setError(SCAN_FAILED_MESSAGE);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void handleFile(file);
        }}
      />
      <Button variant="secondary" loading={scanning} onClick={() => inputRef.current?.click()}>
        Scan receipt photo
      </Button>
      {error && (
        <p role="alert" className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
