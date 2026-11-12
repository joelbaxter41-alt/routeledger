import { records } from "@/lib/records";
import { Heading, Empty } from "@/components/shared";
import { Field, FormActions, Feedback } from "@/components/forms";
import { createInvoice } from "@/app/actions";
import { LineItemsEditor } from "@/components/line-items-editor";
import { localToday } from "@/lib/metrics";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ job?: string; error?: string }>;
}) {
  const r = await records(),
    p = await searchParams;
  const j = r.jobs.find((j) => j.id === p.job && j.status === "completed");
  return (
    <>
      <Heading
        title="Create invoice"
        description="A clear, professional record of the work you delivered. Solo Pro required."
      />
      <Feedback params={p} />
      {!r.customers.length ? (
        <Empty
          title="Add a customer first"
          description="Invoices are connected to a customer."
          href="/app/customers/new"
        />
      ) : (
        <form className="card" action={createInvoice}>
          <input type="hidden" name="request_id" value={crypto.randomUUID()} />
          <input type="hidden" name="job_id" value={j?.id || ""} />
          <div className="form-grid">
            <Field
              label="Customer"
              name="customer_id"
              defaultValue={j?.customer_id || ""}
              required
            >
              <option value="" disabled>
                Select customer
              </option>
              {r.customers
                .filter((c) => !j || c.id === j.customer_id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </Field>
            <Field
              label="Due date"
              name="due_date"
              type="date"
              defaultValue={localToday(r.organization.timezone)}
              required
            />
            <Field
              label="Tax rate (%) · confirm applicability"
              name="tax"
              type="number"
              min={0}
              max={100}
              step="0.01"
              defaultValue={0}
            />
            <div className="full">
              <Field
                label="Notes / payment instructions"
                name="notes"
                type="textarea"
              />
            </div>
          </div>
          <LineItemsEditor
            currency={r.organization.currency}
            initialDescription={j?.description}
            initialCents={j ? (j.final_cents ?? j.quoted_cents) : undefined}
            jobChargeCents={j ? (j.final_cents ?? j.quoted_cents) : undefined}
          />
          <p className="definition">
            Tax is configured by you, never inferred from an address. Each line
            rounds to the nearest minor unit before tax. Customer contact
            information is saved as a historical snapshot.
          </p>
          <FormActions cancel="/app/invoices" label="Create invoice" />
        </form>
      )}
    </>
  );
}
