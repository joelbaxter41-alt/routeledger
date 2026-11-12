import { records } from "@/lib/records";
import { Heading } from "@/components/shared";
import { Field, Feedback, FormActions } from "@/components/forms";
import { saveSettings } from "@/app/actions";
import Link from "next/link";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const r = await records();
  const { data: profile } = await r.db
    .from("profiles")
    .select("display_name")
    .eq("id", r.user.id)
    .maybeSingle();
  return (
    <>
      <Heading
        title="Settings"
        description="The details that make this business yours."
      />
      <Feedback params={await searchParams} />
      <form action={saveSettings} className="card">
        <h2>Business & profile</h2>
        <div className="form-grid">
          <Field
            label="Business name"
            name="name"
            defaultValue={r.organization.name}
            required
          />
          <Field
            label="Business type"
            name="business_type"
            defaultValue={r.organization.business_type}
            required
          />
          <Field
            label="Contact email"
            name="contact_email"
            type="email"
            defaultValue={r.organization.contact_email}
          />
          <Field
            label="Address"
            name="address"
            defaultValue={r.organization.address}
          />
          <Field
            label="Timezone (IANA name)"
            name="timezone"
            defaultValue={r.organization.timezone}
            required
          />
          <Field
            label="Currency · locked after first financial record"
            name="currency"
            defaultValue={r.organization.currency}
          >
            {["USD", "CAD", "GBP", "EUR", "AUD"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Field>
          <Field
            label="Your display name"
            name="display_name"
            defaultValue={profile?.display_name || ""}
          />
        </div>
        <FormActions cancel="/app" />
      </form>
      <div className="actions" style={{ marginTop: 22 }}>
        <Link className="button outline" href="/app/estimates">
          Estimates
        </Link>
        <Link className="button outline" href="/forgot-password">
          Reset password
        </Link>
        <Link className="button outline" href="/app/billing">
          Manage subscription
        </Link>
        <Link className="button outline" href="/app/expenses">
          Expenses
        </Link>
        <Link className="button outline" href="/app/invoices">
          Invoices
        </Link>
        <Link className="button outline" href="/app/services">
          Services
        </Link>
        <Link className="button outline" href="/app/reports">
          Reports
        </Link>
      </div>
    </>
  );
}
