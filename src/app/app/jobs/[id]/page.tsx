import Link from "next/link";
import { notFound } from "next/navigation";
import { records } from "@/lib/records";
import { jobProfit, localToday } from "@/lib/metrics";
import { money, profitability } from "@/lib/finance";
import { Heading, Badge } from "@/components/shared";
import { JobForm } from "@/components/business-forms";
import { Field, Feedback } from "@/components/forms";
import { transitionJob, duplicateJob, makeRecurring } from "@/app/actions";
import { Submit } from "@/components/submit";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string; edit?: string }>;
}) {
  const r = await records(),
    { id } = await params,
    p = await searchParams,
    j = r.jobs.find((j) => j.id === id);
  if (!j) notFound();
  const result = jobProfit(j, r);
  const service = r.services.find((s) => s.id === j.service_id);
  const suggested = profitability(
    result.revenue,
    [result.cost],
    service?.target_bps ?? 3500,
  );
  return (
    <>
      <Heading
        title={j.description}
        description={`${r.customers.find((c) => c.id === j.customer_id)?.name} · ${j.scheduled_date} at ${j.start_time.slice(0, 5)}`}
      />
      <Feedback params={p} />
      <div className="actions" style={{ marginBottom: 22 }}>
        <Badge status={j.status} />
        {!["completed", "canceled"].includes(j.status) && (
          <Link className="button outline" href={`?edit=1`}>
            Edit / reschedule
          </Link>
        )}
        <form action={duplicateJob}>
          <input type="hidden" name="id" value={id} />
          <Submit>Duplicate job</Submit>
        </form>
        {j.status === "completed" && (
          <Link className="button primary" href={`/app/invoices/new?job=${id}`}>
            Create invoice
          </Link>
        )}
        <Link className="button outline" href="/app/expenses">
          Record expense
        </Link>
      </div>
      {p.edit && !["completed", "canceled"].includes(j.status) && (
        <JobForm
          job={j}
          customers={r.customers}
          services={r.services}
          today={localToday(r.organization.timezone)}
        />
      )}
      <div className="details" style={{ marginTop: 22 }}>
        <section className="card">
          <h2>What this job earns</h2>
          {[
            ["Customer charge", result.revenue],
            ["Recorded job costs", result.cost],
            ["Estimated operating profit", result.profit],
          ].map(([label, v]) => (
            <div className="detail-row" key={label}>
              <span>{label}</span>
              <strong
                className={`mono ${label === "Estimated operating profit" ? (result.profit < 0 ? "negative" : "positive") : ""}`}
              >
                {money(Number(v), r.organization.currency)}
              </strong>
            </div>
          ))}
          <div className="detail-row">
            <span>Profit margin</span>
            <strong>
              {result.marginBasisPoints === null
                ? "—"
                : `${(result.marginBasisPoints / 100).toFixed(1)}%`}
            </strong>
          </div>
          <div className="detail-row">
            <span>
              Suggested charge at {(service?.target_bps ?? 3500) / 100}% margin
            </span>
            <strong className="mono">
              {money(suggested.suggestedPrice, r.organization.currency)}
            </strong>
          </div>
          <p className="definition">
            {j.status === "completed"
              ? "Final charge and actual time."
              : "Pre-completion preview; labor uses only recorded actual time."}{" "}
            Labor allowance: {j.actual_minutes} min ×{" "}
            {money(j.labor_rate_cents, r.organization.currency)}/hr. Excludes
            unrecorded overhead, taxes, and owner compensation. Margin differs
            from markup. Pricing suggestions never change the agreed charge.
          </p>
        </section>
        <section className="card">
          <h2>Cost breakdown</h2>
          <div className="detail-row">
            <span>Labor allowance</span>
            <strong className="mono">
              {money(
                result.cost -
                  r.expenses
                    .filter((e) => e.job_id === id)
                    .reduce((s, e) => s + e.amount_cents, 0),
                r.organization.currency,
              )}
            </strong>
          </div>
          {r.expenses
            .filter((e) => e.job_id === id)
            .map((e) => (
              <div className="detail-row" key={e.id}>
                <span>
                  {e.category} · {e.vendor}
                </span>
                <strong className="mono">
                  {money(e.amount_cents, r.organization.currency)}
                </strong>
              </div>
            ))}
          {!r.expenses.some((e) => e.job_id === id) && (
            <p className="muted" style={{ fontSize: 13, marginTop: 20 }}>
              No expenses allocated to this job.
            </p>
          )}
          <p className="definition">
            Historical comparison:{" "}
            {
              r.jobs.filter(
                (x) =>
                  x.id !== id &&
                  x.service_id === j.service_id &&
                  x.status === "completed",
              ).length
            }{" "}
            other completed jobs in this service. Costs added later update
            profitability without changing the agreed customer rate.
          </p>
        </section>
      </div>
      {j.status === "scheduled" && (
        <form className="card" style={{ marginTop: 22 }} action={transitionJob}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="in_progress" />
          <h2>Ready when you are</h2>
          <Submit>Start job</Submit>
        </form>
      )}
      {j.status === "in_progress" && (
        <form className="card" style={{ marginTop: 22 }} action={transitionJob}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="completed" />
          <h2>Complete this job</h2>
          <div className="form-grid">
            <Field
              label="Final customer charge"
              name="final_price"
              type="number"
              min={0}
              step="0.01"
              defaultValue={j.quoted_cents / 100}
              required
            />
            <Field
              label="Actual time worked (minutes)"
              name="actual_minutes"
              type="number"
              min={0}
              defaultValue={j.duration_minutes}
              required
            />
          </div>
          <div className="form-actions">
            <Submit>Complete job & calculate profit</Submit>
          </div>
        </form>
      )}
      {!["completed", "canceled"].includes(j.status) && (
        <div className="details" style={{ marginTop: 22 }}>
          <form className="card" action={makeRecurring}>
            <input type="hidden" name="id" value={id} />
            <h2>Make it recurring · Pro</h2>
            {j.recurring_rule_id ? (
              <p className="muted">Recurring schedule is active.</p>
            ) : (
              <>
                <Field label="Repeat schedule" name="interval">
                  <option value="weekly">Every week</option>
                  <option value="biweekly">Every two weeks</option>
                  <option value="monthly">Every month</option>
                </Field>
                <div className="form-actions">
                  <Submit>Enable recurring schedule</Submit>
                </div>
              </>
            )}
          </form>
          <form className="card" action={transitionJob}>
            <h2>Cancel job</h2>
            <p className="muted" style={{ fontSize: 13 }}>
              Retain the job in your history. Canceled jobs cannot be reopened.
            </p>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="status" value="canceled" />
            <Submit>Cancel this job</Submit>
          </form>
        </div>
      )}
    </>
  );
}
