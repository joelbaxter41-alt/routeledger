import { database, configured } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { createOrganization } from "@/app/actions";
import { Field, Feedback } from "@/components/forms";
import { Submit } from "@/components/submit";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!configured()) redirect("/signup");
  const db = await database();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");
  return (
    <main id="main" className="legal">
      <div className="eyebrow">WELCOME TO ROUTELEDGER</div>
      <h1 style={{ marginTop: 16 }}>Make it your business.</h1>
      <p>Set up your workspace. Your records are private to your business.</p>
      <Feedback params={await searchParams} />
      <form className="card stack" action={createOrganization}>
        <Field label="Business name" name="name" required />
        <Field
          label="Business type"
          name="business_type"
          defaultValue="Lawn care"
        >
          <option>Lawn care</option>
          <option>Snow removal</option>
          <option>Landscaping</option>
          <option>Pressure washing</option>
          <option>Window cleaning</option>
          <option>Property maintenance</option>
          <option>Other services</option>
        </Field>
        <Field
          label="Business timezone (IANA name)"
          name="timezone"
          defaultValue="America/Denver"
          required
        />
        <Field label="Currency" name="currency" defaultValue="USD">
          {["USD", "CAD", "GBP", "EUR", "AUD"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Field>
        <Submit>Create business</Submit>
      </form>
    </main>
  );
}
