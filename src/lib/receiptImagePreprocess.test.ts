import { describe, expect, it } from "vitest";
import { binarize, findReceiptBounds, grayscaleAndContrast } from "./receiptImagePreprocess";

function makeImage(width: number, height: number, bgGray: number, ...brightRegions: { x: number; y: number; w: number; h: number }[]): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const inBright = brightRegions.some((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
      const gray = inBright ? 255 : bgGray;
      const o = (y * width + x) * 4;
      pixels[o] = gray;
      pixels[o + 1] = gray;
      pixels[o + 2] = gray;
      pixels[o + 3] = 255;
    }
  }
  return pixels;
}

describe("grayscaleAndContrast", () => {
  it("stretches faint gray pixels toward black and white", () => {
    // Two RGBA pixels: faint dark gray text (~100) and faint light gray background (~180).
    const pixels = new Uint8ClampedArray([100, 100, 100, 255, 180, 180, 180, 255]);
    grayscaleAndContrast(pixels);

    expect(pixels[0]).toBe(0);
    expect(pixels[4]).toBe(255);
  });

  it("converts color pixels to grayscale using luma weights", () => {
    const pixels = new Uint8ClampedArray([0, 0, 0, 255, 255, 0, 0, 255]);
    grayscaleAndContrast(pixels);

    // Pure red vs. pure black -> min=0, max~76 (0.299*255); red pixel stretches near 255.
    expect(pixels[0]).toBe(0);
    expect(pixels[1]).toBe(0);
    expect(pixels[2]).toBe(0);
    expect(pixels[4]).toBeGreaterThanOrEqual(254);
    expect(pixels[5]).toBeGreaterThanOrEqual(254);
    expect(pixels[6]).toBeGreaterThanOrEqual(254);
  });

  it("preserves alpha and leaves flat images unchanged", () => {
    const pixels = new Uint8ClampedArray([120, 120, 120, 200, 120, 120, 120, 100]);
    grayscaleAndContrast(pixels);

    expect(pixels[3]).toBe(200);
    expect(pixels[7]).toBe(100);
    expect(pixels[0]).toBe(120);
    expect(pixels[4]).toBe(120);
  });
});

describe("findReceiptBounds", () => {
  it("finds the bounding box of a bright region on a dark background", () => {
    const pixels = makeImage(8, 8, 0, { x: 2, y: 2, w: 4, h: 4 });
    expect(findReceiptBounds(pixels, 8, 8)).toEqual({ x: 2, y: 2, width: 4, height: 4 });
  });

  it("returns null for a uniformly-bright image (no separation)", () => {
    const pixels = makeImage(6, 6, 100);
    expect(findReceiptBounds(pixels, 6, 6)).toBeNull();
  });

  it("returns null when the bright region covers nearly the whole frame", () => {
    const pixels = makeImage(8, 8, 255);
    // carve out a single dark pixel so there's a mean to threshold against
    pixels[0] = pixels[1] = pixels[2] = 0;
    expect(findReceiptBounds(pixels, 8, 8)).toBeNull();
  });

  it("returns null for a tiny bright speck", () => {
    const pixels = makeImage(10, 10, 50, { x: 5, y: 5, w: 1, h: 1 });
    expect(findReceiptBounds(pixels, 10, 10)).toBeNull();
  });

  it("picks the larger region and ignores a smaller, separate bright object", () => {
    // A stray bright object (e.g. a napkin corner) plus the real, larger target region.
    const pixels = makeImage(20, 20, 0, { x: 0, y: 0, w: 2, h: 2 }, { x: 8, y: 8, w: 8, h: 8 });
    expect(findReceiptBounds(pixels, 20, 20)).toEqual({ x: 8, y: 8, width: 8, height: 8 });
  });
});

describe("binarize", () => {
  it("pushes below-threshold pixels to black and at/above-threshold pixels to white", () => {
    const pixels = new Uint8ClampedArray([100, 100, 100, 255, 200, 200, 200, 255]);
    binarize(pixels);

    expect(pixels[0]).toBe(0);
    expect(pixels[1]).toBe(0);
    expect(pixels[2]).toBe(0);
    expect(pixels[4]).toBe(255);
    expect(pixels[5]).toBe(255);
    expect(pixels[6]).toBe(255);
  });

  it("preserves alpha", () => {
    const pixels = new Uint8ClampedArray([10, 10, 10, 77, 250, 250, 250, 33]);
    binarize(pixels);

    expect(pixels[3]).toBe(77);
    expect(pixels[7]).toBe(33);
  });

  it("respects a custom threshold", () => {
    const pixels = new Uint8ClampedArray([60, 60, 60, 255]);
    binarize(pixels, 50);
    expect(pixels[0]).toBe(255);

    const pixels2 = new Uint8ClampedArray([60, 60, 60, 255]);
    binarize(pixels2, 70);
    expect(pixels2[0]).toBe(0);
  });
});
