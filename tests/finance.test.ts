import { describe, it, expect } from "vitest";
import {
  cents,
  laborCost,
  profitability,
  invoiceTotal,
  balance,
} from "../src/lib/finance";
import {
  canTransition,
  nextOccurrence,
  appointmentInstant,
  entitled,
} from "../src/lib/domain";
import { customerSchema, jobSchema } from "../src/lib/schemas";
describe("financial integrity", () => {
  it("parses decimal currency without floating-point drift", () => {
    expect(cents("0.29")).toBe(29);
    expect(cents("-12.50")).toBe(-1250);
    expect(cents("100000.01")).toBe(10000001);
    expect(() => cents("1.001")).toThrow();
    expect(() => cents("NaN")).toThrow();
  });
  it("rounds labor half-up to the nearest cent", () => {
    expect(laborCost(1, 100)).toBe(2);
    expect(laborCost(90, 2500)).toBe(3750);
    expect(() => laborCost(-1, 100)).toThrow();
  });
  it("calculates margin, not markup, and suggests target pricing", () => {
    expect(profitability(10000, [2500, 1500], 6000)).toEqual({
      revenue: 10000,
      cost: 4000,
      profit: 6000,
      marginBasisPoints: 6000,
      suggestedPrice: 10000,
    });
  });
  it("handles losses, zero and negative revenue safely", () => {
    expect(profitability(0, [100]).marginBasisPoints).toBeNull();
    expect(profitability(-100, [100]).marginBasisPoints).toBeNull();
    expect(profitability(100, [200]).marginBasisPoints).toBe(-10000);
    expect(() => profitability(100, [1], 10000)).toThrow();
    expect(() => profitability(100, [-1])).toThrow();
  });
  it("rounds invoice lines before tax", () => {
    expect(
      invoiceTotal(
        [
          { quantity_milli: 1500, unit_cents: 101 },
          { quantity_milli: 1000, unit_cents: 100 },
        ],
        825,
      ),
    ).toEqual({ subtotal: 252, tax: 21, total: 273 });
  });
  it("tracks partial payments without overpayments", () => {
    expect(balance(1000, [250, 250])).toEqual({
      paid: 500,
      outstanding: 500,
      state: "partially_paid",
    });
    expect(balance(1000, [1000]).state).toBe("paid");
    expect(() => balance(1000, [1001])).toThrow();
  });
});
describe("workflow rules", () => {
  it("rejects invalid lifecycle transitions", () => {
    expect(canTransition("scheduled", "in_progress")).toBe(true);
    expect(canTransition("scheduled", "completed")).toBe(false);
    expect(canTransition("completed", "in_progress")).toBe(false);
  });
  it("preserves monthly anchor across short months", () => {
    expect(nextOccurrence("2028-01-31", "monthly", 31)).toBe("2028-02-29");
    expect(nextOccurrence("2028-02-29", "monthly", 31)).toBe("2028-03-31");
    expect(nextOccurrence("2026-03-01", "biweekly")).toBe("2026-03-15");
  });
  it("keeps wall clock time through DST changes", () => {
    expect(appointmentInstant("2026-03-07", "09:00", "America/Denver")).toBe(
      "2026-03-07T16:00:00.000Z",
    );
    expect(appointmentInstant("2026-03-09", "09:00", "America/Denver")).toBe(
      "2026-03-09T15:00:00.000Z",
    );
  });
  it("denies expired and unverified entitlement states", () => {
    expect(entitled("active")).toBe(true);
    for (const status of [
      "past_due",
      "unpaid",
      "canceled",
      "incomplete",
      undefined,
    ])
      expect(entitled(status)).toBe(false);
  });
  it("validates customer and job inputs", () => {
    expect(
      customerSchema.safeParse({
        name: "",
        email: "bad",
        phone: "",
        address: "",
        notes: "",
      }).success,
    ).toBe(false);
    expect(
      jobSchema.safeParse({ customer_id: "other-tenant-id", quoted_cents: -1 })
        .success,
    ).toBe(false);
  });
});
