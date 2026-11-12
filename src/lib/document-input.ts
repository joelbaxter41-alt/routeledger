import { z } from "zod";
import { cents, integer, invoiceTotal } from "./finance";
export function quantityMilli(value: string) {
  if (!/^\d+(\.\d{1,3})?$/.test(value))
    throw new Error("Quantity must have at most three decimal places");
  const [whole, fraction = ""] = value.split(".");
  return integer(
    Number(BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, "0"))),
  );
}
export const documentLineSchema = z.object({
  description: z.string().trim().min(1, "Describe each line item").max(2000),
  quantity_milli: z.number().int().min(1).max(1000000),
  unit_cents: z.number().int().min(0).max(1000000000000),
});
export const documentLinesSchema = z
  .array(documentLineSchema)
  .min(1)
  .max(50)
  .refine(
    (lines) => invoiceTotal(lines).subtotal <= 1000000000000,
    "Document subtotal exceeds supported amount",
  );
export function parseDocumentLines(form: FormData) {
  const descriptions = form.getAll("item_description"),
    quantities = form.getAll("item_quantity"),
    prices = form.getAll("item_price");
  if (
    descriptions.length !== quantities.length ||
    descriptions.length !== prices.length
  )
    throw new Error("Line item fields do not match");
  return documentLinesSchema.parse(
    descriptions.map((description, i) => ({
      description: String(description),
      quantity_milli: quantityMilli(String(quantities[i])),
      unit_cents: cents(String(prices[i])),
    })),
  );
}
