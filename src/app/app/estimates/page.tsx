import { LineItemsEditor } from "@/components/line-items-editor";
import { records } from "@/lib/records";
import { Heading, Empty, Badge } from "@/components/shared";
import { Field, Feedback, FormActions } from "@/components/forms";
import { createEstimate, convertEstimate } from "@/app/actions";
import { Submit } from "@/components/submit";
import { PrintButton } from "@/components/print-button";
import { money, invoiceTotal } from "@/lib/finance";
import { localToday } from "@/lib/metrics";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const r = await records(),
    today = localToday(r.organization.timezone);
  return (
    <>
      <Heading
        title="Estimates"
        description="Price with confidence. Turn a yes into a job. Solo Pro required."
      />
      <Feedback params={await searchParams} />
      <div className="stack">
        {r.estimates.map((e) => (
          <section className="card" key={e.id}>
            <div className="section-head">
              <div>
                <h2>{e.description}</h2>
                <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>
                  {r.customers.find((c) => c.id === e.customer_id)?.name} ·
                  expires {e.expires_date}
                </p>
              </div>
              <Badge
                status={
                  e.status === "draft" && e.expires_date < today
                    ? "expired"
                    : e.status
                }
              />
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Unit price</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {r.estimateItems
                    .filter((i) => i.estimate_id === e.id)
                    .map((item) => (
                      <tr key={item.id}>
                        <td>{item.description}</td>
                        <td>{item.quantity_milli / 1000}</td>
                        <td className="mono">
                          {money(item.unit_cents, r.organization.currency)}
                        </td>
                        <td className="mono">
                          {money(
                            invoiceTotal([item]).subtotal,
                            r.organization.currency,
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="detail-row">
              <span>Estimated charge</span>
              <strong className="mono">
                {money(
                  invoiceTotal(
                    r.estimateItems.filter((i) => i.estimate_id === e.id),
                  ).total,
                  r.organization.currency,
                )}
              </strong>
            </div>
            <p className="muted" style={{ fontSize: 13 }}>
              {e.notes}
            </p>
            {!e.converted_job_id && e.expires_date >= today && (
              <form
                action={convertEstimate}
                className="actions no-print"
                style={{ alignItems: "end" }}
              >
                <input type="hidden" name="id" value={e.id} />
                <Field
                  label="Accepted · schedule date"
                  name="scheduled_date"
                  type="date"
                  defaultValue={today}
                  required
                />
                <Field
                  label="Start time"
                  name="start_time"
                  type="time"
                  defaultValue="09:00"
                  required
                />
                <Submit>Accept & create job</Submit>
              </form>
            )}
          </section>
        ))}
        {!r.estimates.length && (
          <section className="card">
            <Empty
              title="Your next job begins with a good estimate"
              description="Define the scope and agreed price before work begins."
            />
          </section>
        )}
        <div className="no-print">
          <PrintButton />
        </div>
        {r.customers.length > 0 && (
          <form action={createEstimate} className="card no-print">
            <h2>Create an estimate</h2>
            <input
              type="hidden"
              name="request_id"
              value={crypto.randomUUID()}
            />
            <div className="form-grid">
              <Field label="Customer" name="customer_id" required>
                <option value="">Choose customer</option>
                {r.customers
                  .filter((c) => !c.archived)
                  .map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.name}
                    </option>
                  ))}
              </Field>
              <Field
                label="Expiration date"
                name="expires_date"
                type="date"
                defaultValue={today}
                required
              />
              <Field label="Scope of work" name="description" required />
              <div className="full">
                <Field label="Notes" name="notes" type="textarea" />
              </div>
            </div>
            <LineItemsEditor currency={r.organization.currency} />
            <FormActions cancel="/app/estimates" label="Create estimate" />
          </form>
        )}
      </div>
    </>
  );
}
