"use server";
import { redirect, unstable_rethrow } from "next/navigation";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/supabase";
import { context } from "@/lib/context";
import { cents } from "@/lib/finance";
import { parseDocumentLines } from "@/lib/document-input";
import {
  customerSchema,
  serviceSchema,
  jobSchema,
  expenseSchema,
  organizationSchema,
  uuid,
} from "@/lib/schemas";
import { z } from "zod";
import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { rateLimit } from "@/lib/admin";
const value = (f: FormData, key: string) => String(f.get(key) ?? "").trim();
const amount = (f: FormData, key: string) => cents(value(f, key) || "0");
async function run(path: string, fn: () => Promise<string | void>) {
  let destination = path;
  try {
    destination = (await fn()) || path;
  } catch (e) {
    unstable_rethrow(e);
    const message =
      e instanceof z.ZodError
        ? e.issues.map((i) => `${i.path.join(" ")}: ${i.message}`).join("; ")
        : e instanceof Error
          ? e.message
          : "Unable to save";
    redirect(
      `${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`,
    );
  }
  revalidatePath("/app", "layout");
  redirect(
    `${destination}${destination.includes("?") ? "&" : "?"}success=Saved`,
  );
}
function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}
async function manager() {
  const ctx = await context();
  if (!["owner", "admin"].includes(ctx.role))
    throw new Error("Manager permissions required");
  return ctx;
}
export async function authenticate(form: FormData) {
  const mode = value(form, "mode");
  const path =
    mode === "signup"
      ? "/signup"
      : mode === "reset"
        ? "/forgot-password"
        : "/login";
  await run(path, async () => {
    const email = z.email().parse(value(form, "email"));
    const requestHeaders = await headers();
    const fingerprint = createHash("sha256")
      .update(
        `${requestHeaders.get("x-real-ip") || "unknown"}:${email.toLowerCase()}`,
      )
      .digest("hex");
    await rateLimit(`auth:${fingerprint}`, 10, 900);
    const db = await database();
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      new URL((await headers()).get("origin") || "http://localhost:3000")
        .origin;
    if (mode === "reset") {
      const { error } = await db.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
      });
      check(error);
      return "/forgot-password?requested=1";
    }
    const password = z
      .string()
      .min(10, "Use at least 10 characters")
      .max(128)
      .parse(String(form.get("password") ?? ""));
    if (mode === "signup") {
      const { data, error } = await db.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${origin}/auth/callback` },
      });
      check(error);
      return data.session ? "/onboarding" : "/login?verify=1";
    }
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error)
      throw new Error("Unable to sign in. Check your email and password.");
    return "/app";
  });
}
export async function logout() {
  const db = await database();
  await db.auth.signOut();
  redirect("/login");
}
export async function resetPassword(form: FormData) {
  await run("/reset-password", async () => {
    const password = z
      .string()
      .min(10)
      .max(128)
      .parse(String(form.get("password") ?? ""));
    const db = await database();
    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user) throw new Error("Open the recovery link from your email first.");
    const { error } = await db.auth.updateUser({ password });
    check(error);
    return "/app";
  });
}
export async function createOrganization(form: FormData) {
  await run("/onboarding", async () => {
    const input = organizationSchema.parse({
      name: value(form, "name"),
      business_type: value(form, "business_type"),
      timezone: value(form, "timezone"),
      currency: value(form, "currency"),
      contact_email: "",
      address: "",
    });
    const db = await database();
    const { error } = await db.rpc("create_organization", {
      p_name: input.name,
      p_type: input.business_type,
      p_timezone: input.timezone,
      p_currency: input.currency,
    });
    check(error);
    return "/app";
  });
}
export async function saveCustomer(form: FormData) {
  const id = value(form, "id");
  await run(id ? `/app/customers/${id}` : "/app/customers/new", async () => {
    const { db, organization } = await manager();
    const input = customerSchema.parse(
      Object.fromEntries(
        ["name", "email", "phone", "address", "notes"].map((k) => [
          k,
          value(form, k),
        ]),
      ),
    );
    if (id) {
      uuid.parse(id);
      check(
        (
          await db
            .from("customers")
            .update(input)
            .eq("id", id)
            .eq("organization_id", organization.id)
        ).error,
      );
      return `/app/customers/${id}`;
    }
    const { data, error } = await db
      .from("customers")
      .insert({ ...input, organization_id: organization.id })
      .select("id")
      .single();
    check(error);
    return `/app/customers/${data!.id}`;
  });
}
export async function archiveCustomer(form: FormData) {
  await run("/app/customers", async () => {
    const { db, organization } = await manager();
    check(
      (
        await db
          .from("customers")
          .update({ archived: value(form, "archived") === "true" })
          .eq("id", uuid.parse(value(form, "id")))
          .eq("organization_id", organization.id)
      ).error,
    );
  });
}
export async function saveService(form: FormData) {
  await run("/app/services", async () => {
    const { db, organization } = await manager();
    const input = serviceSchema.parse({
      name: value(form, "name"),
      description: value(form, "description"),
      default_cents: amount(form, "price"),
      duration_minutes: Number(value(form, "duration")),
      labor_rate_cents: amount(form, "labor_rate"),
      target_bps: cents(value(form, "target") || "35"),
    });
    const id = value(form, "id");
    check(
      id
        ? (
            await db
              .from("services")
              .update(input)
              .eq("id", uuid.parse(id))
              .eq("organization_id", organization.id)
          ).error
        : (
            await db
              .from("services")
              .insert({ ...input, organization_id: organization.id })
          ).error,
    );
  });
}
export async function saveJob(form: FormData) {
  const id = value(form, "id");
  await run(id ? `/app/jobs/${id}` : "/app/jobs/new", async () => {
    const { db, organization } = await manager();
    const input = jobSchema.parse({
      customer_id: value(form, "customer_id"),
      service_id: value(form, "service_id"),
      description: value(form, "description"),
      scheduled_date: value(form, "scheduled_date"),
      start_time: value(form, "start_time"),
      quoted_cents: amount(form, "price"),
      labor_rate_cents: amount(form, "labor_rate"),
      duration_minutes: Number(value(form, "duration")),
      notes: value(form, "notes"),
    });
    const row = {
      ...input,
      service_id: input.service_id || null,
      organization_id: organization.id,
    };
    const start = input.start_time + ":00";
    const endMinutes =
      Number(input.start_time.slice(0, 2)) * 60 +
      Number(input.start_time.slice(3)) +
      input.duration_minutes;
    const { data: conflicts, error: conflictError } = await db
      .from("jobs")
      .select("id,start_time,duration_minutes")
      .eq("organization_id", organization.id)
      .eq("scheduled_date", input.scheduled_date)
      .in("status", ["scheduled", "in_progress"]);
    check(conflictError);
    if (
      conflicts?.some(
        (j) =>
          j.id !== id &&
          Number(j.start_time.slice(0, 2)) * 60 +
            Number(j.start_time.slice(3, 5)) <
            endMinutes &&
          Number(j.start_time.slice(0, 2)) * 60 +
            Number(j.start_time.slice(3, 5)) +
            j.duration_minutes >
            Number(start.slice(0, 2)) * 60 + Number(start.slice(3, 5)),
      )
    )
      throw new Error(
        "This appointment overlaps an existing job. Choose another time.",
      );
    if (id) {
      check(
        (
          await db
            .from("jobs")
            .update(row)
            .eq("id", uuid.parse(id))
            .eq("organization_id", organization.id)
        ).error,
      );
      return `/app/jobs/${id}`;
    }
    const { data, error } = await db
      .from("jobs")
      .insert(row)
      .select("id")
      .single();
    check(error);
    return `/app/jobs/${data!.id}`;
  });
}
export async function transitionJob(form: FormData) {
  const id = uuid.parse(value(form, "id"));
  await run(`/app/jobs/${id}`, async () => {
    const { db, organization } = await manager();
    const status = z
      .enum(["in_progress", "completed", "canceled"])
      .parse(value(form, "status"));
    const update: Record<string, unknown> = { status };
    if (status === "completed") {
      update.final_cents = amount(form, "final_price");
      update.actual_minutes = z
        .number()
        .int()
        .min(0)
        .max(100000)
        .parse(Number(value(form, "actual_minutes")));
    }
    check(
      (
        await db
          .from("jobs")
          .update(update)
          .eq("id", id)
          .eq("organization_id", organization.id)
      ).error,
    );
  });
}
export async function duplicateJob(form: FormData) {
  await run("/app/jobs", async () => {
    const { db, organization } = await manager();
    const { data, error } = await db
      .from("jobs")
      .select("*")
      .eq("id", uuid.parse(value(form, "id")))
      .eq("organization_id", organization.id)
      .single();
    check(error);
    return `/app/jobs/new?copy=${data.id}`;
  });
}
export async function saveExpense(form: FormData) {
  await run("/app/expenses", async () => {
    const { db, organization } = await manager();
    const input = expenseSchema.parse({
      vendor: value(form, "vendor"),
      description: value(form, "description"),
      category: value(form, "category"),
      amount_cents: amount(form, "amount"),
      expense_date: value(form, "expense_date"),
      job_id: value(form, "job_id"),
    });
    const row = {
      ...input,
      job_id: input.job_id || null,
      organization_id: organization.id,
    };
    const id = value(form, "id");
    check(
      id
        ? (
            await db
              .from("expenses")
              .update(row)
              .eq("id", uuid.parse(id))
              .eq("organization_id", organization.id)
          ).error
        : (await db.from("expenses").insert(row)).error,
    );
  });
}
export async function createInvoice(form: FormData) {
  await run("/app/invoices/new", async () => {
    const { db, organization } = await manager();
    const { data, error } = await db.rpc("create_invoice_with_items", {
      p_org: organization.id,
      p_customer: uuid.parse(value(form, "customer_id")),
      p_job: value(form, "job_id") ? uuid.parse(value(form, "job_id")) : null,
      p_items: parseDocumentLines(form),
      p_request: uuid.parse(value(form, "request_id")),
      p_tax: z
        .number()
        .int()
        .min(0)
        .max(10000)
        .parse(cents(value(form, "tax") || "0")),
      p_due: z.iso.date().parse(value(form, "due_date")),
      p_notes: value(form, "notes"),
    });
    check(error);
    return `/app/invoices/${data}`;
  });
}
export async function recordPayment(form: FormData) {
  const id = uuid.parse(value(form, "invoice_id"));
  await run(`/app/invoices/${id}`, async () => {
    const { db } = await manager();
    const { error } = await db.rpc("record_payment", {
      p_invoice: id,
      p_amount: amount(form, "amount"),
      p_date: z.iso.date().parse(value(form, "payment_date")),
      p_reference: value(form, "reference"),
      p_request: uuid.parse(value(form, "request_id")),
    });
    check(error);
  });
}
export async function createEstimate(form: FormData) {
  await run("/app/estimates", async () => {
    const { db, organization } = await manager();
    const { error } = await db.rpc("create_estimate_with_items", {
      p_org: organization.id,
      p_customer: uuid.parse(value(form, "customer_id")),
      p_description: z
        .string()
        .min(1)
        .max(2000)
        .parse(value(form, "description")),
      p_items: parseDocumentLines(form),
      p_request: uuid.parse(value(form, "request_id")),
      p_expires: z.iso.date().parse(value(form, "expires_date")),
      p_notes: value(form, "notes"),
    });
    check(error);
  });
}
export async function convertEstimate(form: FormData) {
  await run("/app/estimates", async () => {
    const { db } = await manager();
    const { data, error } = await db.rpc("convert_estimate", {
      p_estimate: uuid.parse(value(form, "id")),
      p_date: z.iso.date().parse(value(form, "scheduled_date")),
      p_time: z
        .string()
        .regex(/^\d{2}:\d{2}$/)
        .parse(value(form, "start_time")),
    });
    check(error);
    return `/app/jobs/${data}`;
  });
}
export async function saveSettings(form: FormData) {
  await run("/app/settings", async () => {
    const { db, organization, user } = await manager();
    const input = organizationSchema.parse(
      Object.fromEntries(
        [
          "name",
          "business_type",
          "timezone",
          "currency",
          "contact_email",
          "address",
        ].map((k) => [k, value(form, k)]),
      ),
    );
    if (input.currency !== organization.currency) {
      const { count } = await db
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organization.id);
      const { count: expenseCount } = await db
        .from("expenses")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organization.id);
      if (count || expenseCount)
        throw new Error("Currency is locked after financial records exist.");
    }
    check(
      (await db.from("organizations").update(input).eq("id", organization.id))
        .error,
    );
    check(
      (
        await db.from("profiles").upsert({
          id: user.id,
          display_name: z.string().max(200).parse(value(form, "display_name")),
        })
      ).error,
    );
  });
}
export async function makeRecurring(form: FormData) {
  const id = uuid.parse(value(form, "id"));
  await run(`/app/jobs/${id}`, async () => {
    const { db } = await manager();
    check(
      (
        await db.rpc("make_recurring", {
          p_job: id,
          p_interval: z
            .enum(["weekly", "biweekly", "monthly"])
            .parse(value(form, "interval")),
        })
      ).error,
    );
  });
}
