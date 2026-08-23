import { describe, expect, it } from "vitest";
import {
  getDuplicateNameIndices,
  getItemFieldErrors,
  getMoneyError,
  getNameError,
  getQuantityError,
  isItemValid,
  isNameTaken,
} from "./validation";
import type { ReceiptItem } from "./splitCalculator";

describe("getNameError", () => {
  it("passes a normal name", () => expect(getNameError("Alice")).toBeNull());
  it("passes a name with an apostrophe", () => expect(getNameError("O'Brien")).toBeNull());
  it("passes a name with a hyphen", () => expect(getNameError("Jean-Luc")).toBeNull());
  it("rejects an empty name", () => expect(getNameError("")).not.toBeNull());
  it("rejects a whitespace-only name", () => expect(getNameError("   ")).not.toBeNull());

  for (const char of ["*", "?", "%", "_"]) {
    it(`rejects a name containing "${char}"`, () => {
      expect(getNameError(`Ali${char}ce`)).toBe("No * ? % _ allowed");
    });
  }
});

describe("getQuantityError", () => {
  it("passes a positive integer", () => expect(getQuantityError(3)).toBeNull());
  it("rejects a decimal quantity", () => expect(getQuantityError(1.5)).not.toBeNull());
  it("rejects zero", () => expect(getQuantityError(0)).not.toBeNull());
  it("rejects a negative quantity", () => expect(getQuantityError(-2)).not.toBeNull());
});

describe("getMoneyError", () => {
  it("passes zero cents", () => expect(getMoneyError(0)).toBeNull());
  it("passes positive cents", () => expect(getMoneyError(1999)).toBeNull());
  it("rejects negative cents", () => expect(getMoneyError(-500)).not.toBeNull());
});

describe("getItemFieldErrors / isItemValid", () => {
  const bad: ReceiptItem = { id: "i1", name: "Ali*ce's Soda", quantity: 1.5, unitPriceCents: -100 };
  const good: ReceiptItem = { id: "i2", name: "Soda", quantity: 2, unitPriceCents: 250 };

  it("flags every invalid field", () => {
    const e = getItemFieldErrors(bad);
    expect(e.name).not.toBeNull();
    expect(e.quantity).not.toBeNull();
    expect(e.unitPrice).not.toBeNull();
  });

  it("passes a fully valid item", () => {
    const e = getItemFieldErrors(good);
    expect(e.name).toBeNull();
    expect(e.quantity).toBeNull();
    expect(e.unitPrice).toBeNull();
  });

  it("isItemValid mirrors getItemFieldErrors", () => {
    expect(isItemValid(bad)).toBe(false);
    expect(isItemValid(good)).toBe(true);
  });
});

describe("isNameTaken", () => {
  it("matches regardless of case", () => {
    expect(isNameTaken("ABC", ["abc"])).toBe(true);
    expect(isNameTaken("abc", ["ABC"])).toBe(true);
  });
  it("matches regardless of surrounding whitespace", () => {
    expect(isNameTaken("  Alice ", ["Alice"])).toBe(true);
  });
  it("returns false when there's no match", () => {
    expect(isNameTaken("Alice", ["Bob"])).toBe(false);
  });
  it("returns false for an empty name", () => {
    expect(isNameTaken("", ["Alice"])).toBe(false);
  });
});

describe("getDuplicateNameIndices", () => {
  it("flags both the original and the case-insensitive duplicate", () => {
    const indices = getDuplicateNameIndices(["Alice", "Bob", "alice"]);
    expect(indices).toEqual(new Set([0, 2]));
  });
  it("returns an empty set when every name is unique", () => {
    expect(getDuplicateNameIndices(["Alice", "Bob"])).toEqual(new Set());
  });
  it("ignores empty names", () => {
    expect(getDuplicateNameIndices(["", ""])).toEqual(new Set());
  });
});
