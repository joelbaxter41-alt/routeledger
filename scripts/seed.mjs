import { createClient } from "@supabase/supabase-js";
if (
  process.env.ALLOW_DEV_SEED !== "true" ||
  !["localhost", "127.0.0.1"].includes(
    new URL(process.env.NEXT_PUBLIC_APP_URL || "http://invalid").hostname,
  )
)
  throw new Error(
    "Development seed requires ALLOW_DEV_SEED=true and a localhost app URL. Never run against production.",
  );
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
const { data: auth, error } = await db.auth.signInWithPassword({
  email: process.env.SEED_EMAIL,
  password: process.env.SEED_PASSWORD,
});
if (error)
  throw new Error("Seed user must already exist in the development project.");
let { data: membership } = await db
  .from("organization_memberships")
  .select("organization_id")
  .eq("user_id", auth.user.id)
  .maybeSingle();
if (!membership) {
  const { data, error } = await db.rpc("create_organization", {
    p_name: "Sample Greenworks · Development",
    p_type: "Lawn care",
    p_timezone: "America/Denver",
    p_currency: "USD",
  });
  if (error) throw error;
  membership = { organization_id: data };
}
const org = membership.organization_id;
const { count } = await db
  .from("customers")
  .select("*", { head: true, count: "exact" })
  .eq("organization_id", org);
if (count) throw new Error("Seed only runs in an empty development workspace.");
const { data: customer, error: ce } = await db
  .from("customers")
  .insert({
    organization_id: org,
    name: "Sample Customer · Development",
    email: "customer@example.com",
    address: "Sample address — development only",
  })
  .select()
  .single();
if (ce) throw ce;
const { data: service, error: se } = await db
  .from("services")
  .insert({
    organization_id: org,
    name: "Lawn mowing · Sample",
    default_cents: 8500,
    duration_minutes: 60,
    labor_rate_cents: 2500,
    target_bps: 3500,
  })
  .select()
  .single();
if (se) throw se;
const date = new Date().toISOString().slice(0, 10);
const { data: job, error: je } = await db
  .from("jobs")
  .insert({
    organization_id: org,
    customer_id: customer.id,
    service_id: service.id,
    description: "Sample front lawn · Development",
    scheduled_date: date,
    quoted_cents: 8500,
    labor_rate_cents: 2500,
  })
  .select()
  .single();
if (je) throw je;
for (const update of [
  { status: "in_progress" },
  { status: "completed", actual_minutes: 60, final_cents: 8500 },
]) {
  const { error } = await db.from("jobs").update(update).eq("id", job.id);
  if (error) throw error;
}
const { error: ee } = await db
  .from("expenses")
  .insert({
    organization_id: org,
    job_id: job.id,
    vendor: "Sample fuel vendor",
    category: "fuel",
    amount_cents: 900,
    expense_date: date,
    description: "Illustrative seed cost",
  });
if (ee) throw ee;
await db.auth.signOut();
console.log(
  "Development sample customer, service, completed job, and expense created. No billing state was granted.",
);
