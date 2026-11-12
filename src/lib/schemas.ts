import { z } from "zod";
const text = z.string().trim().max(2000);
export const uuid = z.uuid();
export const customerSchema = z.object({
  name: text.min(1),
  email: z.union([z.email(), z.literal("")]),
  phone: text,
  address: text,
  notes: text,
});
export const serviceSchema = z.object({
  name: text.min(1),
  description: text,
  default_cents: z.number().int().nonnegative().max(1_000_000_000),
  duration_minutes: z.number().int().min(1).max(1440),
  labor_rate_cents: z.number().int().nonnegative(),
  target_bps: z.number().int().min(0).max(9999),
});
export const jobSchema = z.object({
  customer_id: uuid,
  service_id: z.union([uuid, z.literal("")]),
  description: text.min(1),
  scheduled_date: z.iso.date(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  quoted_cents: z.number().int().nonnegative().max(1_000_000_000),
  labor_rate_cents: z.number().int().nonnegative().max(1_000_000),
  duration_minutes: z.number().int().min(1).max(1440),
  notes: text,
});
export const expenseSchema = z.object({
  vendor: text.min(1),
  description: text,
  category: z.enum([
    "fuel",
    "equipment",
    "maintenance",
    "materials",
    "labor",
    "vehicle",
    "insurance",
    "software",
    "advertising",
    "supplies",
    "other",
  ]),
  amount_cents: z.number().int().positive().max(1_000_000_000),
  expense_date: z.iso.date(),
  job_id: z.union([uuid, z.literal("")]),
});
export const organizationSchema = z.object({
  name: text.min(2),
  business_type: text.min(1),
  timezone: z.string().refine((v) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: v });
      return true;
    } catch {
      return false;
    }
  }, "Invalid timezone"),
  currency: z.enum(["USD", "CAD", "GBP", "EUR", "AUD"]),
  contact_email: z.union([z.email(), z.literal("")]),
  address: text,
});
