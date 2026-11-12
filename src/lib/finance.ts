/** All monetary values are integer minor units. Quantities use thousandths. */
export function integer(value: number) {
  if (!Number.isSafeInteger(value)) throw new Error("Expected a safe integer");
  return value;
}
export function cents(value: string): number {
  if (!/^-?\d+(\.\d{1,2})?$/.test(value))
    throw new Error("Use a monetary amount with at most two decimals");
  const negative = value.startsWith("-");
  const [whole, fraction = ""] = value.replace("-", "").split(".");
  const result = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  return integer(Number(negative ? -result : result));
}
export function roundRatio(numerator: bigint, denominator: bigint): number {
  if (denominator <= 0n) throw new Error("Invalid denominator");
  const sign = numerator < 0n ? -1n : 1n;
  const absolute = numerator * sign;
  return integer(Number(sign * ((absolute + denominator / 2n) / denominator)));
}
export function laborCost(minutes: number, hourlyCents: number) {
  integer(minutes);
  integer(hourlyCents);
  if (minutes < 0 || hourlyCents < 0)
    throw new Error("Costs must be nonnegative");
  return roundRatio(BigInt(minutes) * BigInt(hourlyCents), 60n);
}
export function profitability(
  revenue: number,
  costs: number[],
  targetBasisPoints = 3500,
) {
  integer(revenue);
  costs.forEach(integer);
  integer(targetBasisPoints);
  if (targetBasisPoints < 0 || targetBasisPoints >= 10000)
    throw new Error("Target margin must be 0–99.99%");
  if (costs.some((c) => c < 0)) throw new Error("Costs must be nonnegative");
  const cost = integer(costs.reduce((a, b) => a + b, 0));
  const profit = integer(revenue - cost);
  return {
    revenue,
    cost,
    profit,
    marginBasisPoints:
      revenue > 0 ? roundRatio(BigInt(profit) * 10000n, BigInt(revenue)) : null,
    suggestedPrice: roundRatio(
      BigInt(cost) * 10000n,
      BigInt(10000 - targetBasisPoints),
    ),
  };
}
export type Line = { quantity_milli: number; unit_cents: number };
export function invoiceTotal(items: Line[], taxBasisPoints = 0) {
  integer(taxBasisPoints);
  if (taxBasisPoints < 0 || taxBasisPoints > 10000)
    throw new Error("Invalid tax");
  const subtotal = integer(
    items.reduce((total, item) => {
      integer(item.quantity_milli);
      integer(item.unit_cents);
      if (item.quantity_milli <= 0 || item.unit_cents < 0)
        throw new Error("Invalid line item");
      return (
        total +
        roundRatio(BigInt(item.quantity_milli) * BigInt(item.unit_cents), 1000n)
      );
    }, 0),
  );
  const tax = roundRatio(BigInt(subtotal) * BigInt(taxBasisPoints), 10000n);
  return { subtotal, tax, total: integer(subtotal + tax) };
}
export function balance(total: number, payments: number[]) {
  integer(total);
  payments.forEach(integer);
  if (payments.some((p) => p <= 0))
    throw new Error("Payments must be positive");
  const paid = integer(payments.reduce((a, b) => a + b, 0));
  if (paid > total) throw new Error("Payment exceeds invoice balance");
  return {
    paid,
    outstanding: total - paid,
    state: paid === total ? "paid" : paid > 0 ? "partially_paid" : "sent",
  };
}
export function money(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    value / 100,
  );
}
