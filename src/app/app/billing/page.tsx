import { records } from "@/lib/records";
import { Heading, Badge } from "@/components/shared";
import { Feedback } from "@/components/forms";
import { Submit } from "@/components/submit";
import { checkout, billingPortal } from "@/app/financial-actions";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const r = await records();
  const pro = Boolean(
    r.subscription?.verified_at &&
    ["active", "trialing"].includes(r.subscription.status) &&
    new Date(r.subscription.period_end) > new Date(),
  );
  return (
    <>
      <Heading
        title="Billing"
        description="Start simply. Grow when you’re ready."
      />
      <Feedback params={await searchParams} />
      <div className="card" style={{ marginBottom: 22 }}>
        <div className="section-head">
          <h2>Your plan: {pro ? "Solo Pro" : "Starter"}</h2>
          <Badge status={r.subscription?.status || "free"} />
        </div>
        <p className="muted">
          {r.customers.filter((c) => !c.archived).length} active customers ·{" "}
          {pro ? "Unlimited customers" : "10 included on Starter"}
        </p>
        {r.subscription?.period_end && (
          <p className="definition">
            Verified entitlement through{" "}
            {r.subscription.period_end.slice(0, 10)}. Past-due, unpaid, expired,
            or canceled subscriptions do not unlock paid features.
          </p>
        )}
        <form action={billingPortal}>
          <Submit>Manage subscription</Submit>
        </form>
      </div>
      <div className="details">
        <section className="card">
          <div className="eyebrow">STARTER</div>
          <div className="price" style={{ margin: "15px 0" }}>
            $0 <small>/ month</small>
          </div>
          <p className="muted">The essentials for getting organized.</p>
          <ul className="muted" style={{ fontSize: 14, lineHeight: 2.2 }}>
            <li>10 active customers</li>
            <li>Job scheduling & completion</li>
            <li>Expenses and basic job profit</li>
            <li>Business overview</li>
          </ul>
        </section>
        <section className="card" style={{ borderColor: "#9dba9f" }}>
          <div className="eyebrow positive">SOLO PRO</div>
          <div className="price" style={{ margin: "15px 0" }}>
            $19 <small>/ month · USD reference price</small>
          </div>
          <p className="muted">Turn good work into a stronger business.</p>
          <ul className="muted" style={{ fontSize: 14, lineHeight: 2.2 }}>
            <li>Unlimited customers and jobs</li>
            <li>Recurring schedules</li>
            <li>Estimates, invoices & payments</li>
            <li>Reports and CSV exports</li>
          </ul>
          <form action={checkout}>
            <Submit>Upgrade with Stripe</Submit>
          </form>
          <p className="definition">
            Checkout displays the configured Stripe price and currency.
            Subscription access changes only after verified billing events.
          </p>
        </section>
      </div>
    </>
  );
}
