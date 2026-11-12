import "server-only";
import { context } from "./context";
export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  archived: boolean;
  created_at: string;
};
export type Service = {
  id: string;
  name: string;
  description: string;
  default_cents: number;
  duration_minutes: number;
  labor_rate_cents: number;
  target_bps: number;
  active: boolean;
};
export type Job = {
  id: string;
  customer_id: string;
  service_id: string | null;
  description: string;
  scheduled_date: string;
  start_time: string;
  duration_minutes: number;
  actual_minutes: number;
  labor_rate_cents: number;
  quoted_cents: number;
  final_cents: number | null;
  status: string;
  notes: string;
  completed_at: string | null;
  recurring_rule_id: string | null;
};
export type Expense = {
  id: string;
  job_id: string | null;
  vendor: string;
  description: string;
  category: string;
  amount_cents: number;
  expense_date: string;
};
export type Invoice = {
  id: string;
  customer_id: string;
  job_id: string | null;
  number: number;
  customer_name: string;
  customer_email: string;
  customer_address: string;
  tax_bps: number;
  status: string;
  due_date: string;
  notes: string;
  created_at: string;
};
export type Item = {
  id: string;
  invoice_id: string;
  estimate_id?: string;
  description: string;
  quantity_milli: number;
  unit_cents: number;
};
export type Payment = {
  id: string;
  invoice_id: string;
  amount_cents: number;
  payment_date: string;
  reference: string;
};
export type Estimate = {
  id: string;
  customer_id: string;
  description: string;
  status: string;
  expires_date: string;
  notes: string;
  converted_job_id: string | null;
};
export async function records() {
  const ctx = await context();
  const names = [
    "customers",
    "services",
    "jobs",
    "expenses",
    "invoices",
    "invoice_items",
    "payments",
    "estimates",
    "estimate_items",
    "subscriptions",
  ] as const;
  const results = await Promise.all(
    names.map(async (name) => {
      const combined: Record<string, unknown>[] = [];
      for (let offset = 0; offset <= 5000; offset += 500) {
        const result = await ctx.db
          .from(name)
          .select("*")
          .eq("organization_id", ctx.organization.id)
          .order(name === "subscriptions" ? "organization_id" : "id")
          .range(offset, offset + 499);
        if (result.error) return result;
        if (offset === 5000 && result.data?.length)
          throw new Error(
            "Workspace exceeds the 5,000-record limit for this release.",
          );
        combined.push(...(result.data || []));
        if ((result.data?.length ?? 0) < 500) break;
      }
      return { data: combined, error: null };
    }),
  );
  for (let i = 0; i < results.length; i++)
    if (results[i].error)
      throw new Error(
        `Unable to load ${names[i]}. Check the database configuration.`,
      );
  return {
    ...ctx,
    customers: results[0].data as Customer[],
    services: results[1].data as Service[],
    jobs: results[2].data as Job[],
    expenses: results[3].data as Expense[],
    invoices: results[4].data as Invoice[],
    items: results[5].data as Item[],
    payments: results[6].data as Payment[],
    estimates: results[7].data as Estimate[],
    estimateItems: results[8].data as Item[],
    subscription: results[9].data?.[0] as
      { status: string; period_end: string; verified_at: string } | undefined,
  };
}
export type Records = Awaited<ReturnType<typeof records>>;
