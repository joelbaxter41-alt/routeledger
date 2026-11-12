import { describe, it, expect } from "vitest";
import { quantityMilli, parseDocumentLines } from "../src/lib/document-input";
import { invoiceTotal } from "../src/lib/finance";
function input(
  lines: { description: string; quantity: string; price: string }[],
) {
  const form = new FormData();
  for (const line of lines) {
    form.append("item_description", line.description);
    form.append("item_quantity", line.quantity);
    form.append("item_price", line.price);
  }
  return form;
}
describe("multi-line financial document input", () => {
  it("parses fractional quantities exactly and matches financial rounding", () => {
    const lines = parseDocumentLines(
      input([
        { description: "Mowing", quantity: "1.5", price: "80.01" },
        { description: "Supplies", quantity: "2.125", price: "3.50" },
      ]),
    );
    expect(lines[0].quantity_milli).toBe(1500);
    expect(lines[1].quantity_milli).toBe(2125);
    expect(invoiceTotal(lines, 825)).toEqual({
      subtotal: 12746,
      tax: 1052,
      total: 13798,
    });
  });
  it("rejects excessive precision, negative quantities and scientific notation", () => {
    for (const value of ["1.0001", "-1", "1e3", "NaN"])
      expect(() => quantityMilli(value)).toThrow();
    expect(quantityMilli("0.001")).toBe(1);
  });
  it("rejects empty, mismatched, blank and oversized item lists", () => {
    expect(() => parseDocumentLines(new FormData())).toThrow();
    const mismatch = input([
      { description: "Good", quantity: "1", price: "1" },
    ]);
    mismatch.append("item_price", "5");
    expect(() => parseDocumentLines(mismatch)).toThrow(/match/);
    expect(() =>
      parseDocumentLines(
        input([{ description: " ", quantity: "1", price: "1" }]),
      ),
    ).toThrow();
    expect(() =>
      parseDocumentLines(
        input(
          Array.from({ length: 51 }, () => ({
            description: "Too many",
            quantity: "1",
            price: "1",
          })),
        ),
      ),
    ).toThrow();
  });
});
