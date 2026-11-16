import { createClient } from "@supabase/supabase-js";

// Read-only checks. Print configuration names and outcomes, never values.
const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_APP_URL",
];
const missing = required.filter((name) => !process.env[name]);
const serverKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serverKey)
  missing.push("SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY)");
if (missing.length) {
  console.error(
    "Missing local/runtime settings:\n" +
      missing.map((name) => `- ${name}`).join("\n"),
  );
  process.exitCode = 1;
} else {
  const origin = new URL(process.env.NEXT_PUBLIC_APP_URL);
  if (
    origin.protocol !== "https:" &&
    !["localhost", "127.0.0.1"].includes(origin.hostname)
  )
    throw new Error("Use an HTTPS application URL outside localhost.");
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const publicClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    options,
  );
  const privateClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    serverKey,
    options,
  );
  const results = await Promise.allSettled([
    privateClient
      .from("organizations")
      .select("id", { head: true, count: "exact" }),
    publicClient.rpc("document_subtotal", {
      p_items: [
        {
          description: "Read-only setup check",
          quantity_milli: 1000,
          unit_cents: 0,
        },
      ],
    }),
  ]);
  for (const [index, result] of results.entries()) {
    const label =
      index === 0
        ? "Private database access and foundation schema"
        : "Public API and document migration";
    if (result.status === "rejected" || result.value.error) {
      console.error(
        `${label}: FAILED. Check project keys and applied migrations.`,
      );
      process.exitCode = 1;
    } else console.log(`${label}: passed`);
  }
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)
    console.log(
      "Invoice email: not configured. Add RESEND_API_KEY and a verified EMAIL_FROM when ready.",
    );
  console.log(
    "Stripe excluded from this check. Auth redirect settings, real email delivery, legal details, backup restoration and authenticated browser workflows require separate verification.",
  );
}
