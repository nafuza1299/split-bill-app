import type { Person, ReceiptItem } from "../lib/splitCalculator";

export const alice: Person = { id: "p1", name: "Alice" };
export const bob: Person = { id: "p2", name: "Bob" };
export const twoPeople: Person[] = [alice, bob];

export const pizza: ReceiptItem = { id: "i1", name: "Pizza", quantity: 1, unitPriceCents: 2000 };
