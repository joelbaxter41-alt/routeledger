import { notFound } from "next/navigation";
import { records } from "@/lib/records";
import { invoiceSummary, localToday } from "@/lib/metrics";
import { money, invoiceTotal } from "@/lib/finance";
import { Heading, Badge } from "@/components/shared";
import { Field, Feedback } from "@/components/forms";
import { recordPayment } from "@/app/actions";
import { sendInvoice, changeInvoiceStatus } from "@/app/financial-actions";
import { Submit } from "@/components/submit";
import { PrintButton } from "@/components/print-button";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const r = await records(),
    { id } = await params,
    i = r.invoices.find((i) => i.id === id);
  if (!i) notFound();
  const s = invoiceSummary(i, r, localToday(r.organization.timezone));
  return (
    <>
      <div className="no-print">
        <Heading
          title={`Invoice INV-${String(i.number).padStart(4, "0")}`}
          description="A clear record. A confident follow-up."
        />
        <Feedback params={await searchParams} />
      </div>
      <section className="card invoice-paper">
        <div className="section-head">
          <div>
            <h2>{r.organization.name}</h2>
            <p className="muted" style={{ fontSize: 13 }}>
              {r.organization.address}
              <br />
              {r.organization.contact_email}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h2>INVOICE</h2>
            <span className="mono">
              INV-{String(i.number).padStart(4, "0")}
            </span>
            <div style={{ marginTop: 10 }}>
              <Badge status={s.status} />
            </div>
          </div>
        </div>
        <div className="details">
          <div>
            <div className="eyebrow">BILL TO</div>
            <p style={{ fontSize: 14, marginTop: 10 }}>
              {i.customer_name}
              <br />
              {i.customer_email}
              <br />
              {i.customer_address}
            </p>
          </div>
          <div>
            <div className="detail-row">
              <span>Issued</span>
              <span>{i.created_at.slice(0, 10)}</span>
            </div>
            <div className="detail-row">
              <span>Payment due</span>
              <span>{i.due_date}</span>
            </div>
          </div>
        </div>
        <div className="table-wrap" style={{ marginTop: 20 }}>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {r.items
                .filter((x) => x.invoice_id === id)
                .map((x) => (
                  <tr key={x.id}>
                    <td>{x.description}</td>
                    <td>{x.quantity_milli / 1000}</td>
                    <td className="mono">
                      {money(x.unit_cents, r.organization.currency)}
                    </td>
                    <td className="mono">
                      {money(
                        invoiceTotal([x]).subtotal,
                        r.organization.currency,
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div style={{ maxWidth: 360, margin: "25px 0 25px auto" }}>
          {[
            ["Subtotal", s.subtotal],
            [`Tax (${i.tax_bps / 100}%)`, s.tax],
            ["Total", s.total],
            ["Payments received", s.paid],
            ["Balance due", s.outstanding],
          ].map(([label, v]) => (
            <div className="detail-row" key={label}>
              <span>{label}</span>
              <strong className="mono">
                {money(Number(v), r.organization.currency)}
              </strong>
            </div>
          ))}
        </div>
        {i.notes && (
          <p className="muted" style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
            {i.notes}
          </p>
        )}
        <p className="definition">Thank you for your business.</p>
      </section>
      <div
        className="actions no-print"
        style={{ margin: "22px auto", maxWidth: 850 }}
      >
        <PrintButton />
        {i.status !== "voided" && (
          <>
            <form action={sendInvoice}>
              <input type="hidden" name="id" value={id} />
              <Submit>Email invoice</Submit>
            </form>
            <form action={changeInvoiceStatus}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="status" value="sent" />
              <Submit>Mark sent manually</Submit>
            </form>
            {s.paid === 0 && (
              <form action={changeInvoiceStatus}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="status" value="voided" />
                <Submit>Void invoice</Submit>
              </form>
            )}
          </>
        )}
      </div>
      <div
        className="details no-print"
        style={{ maxWidth: 850, margin: "auto" }}
      >
        {s.outstanding > 0 && i.status !== "voided" && (
          <form action={recordPayment} className="card">
            <h2>Record a payment</h2>
            <p className="muted" style={{ fontSize: 12 }}>
              Record money actually received. Sending an invoice never marks it
              paid.
            </p>
            <input type="hidden" name="invoice_id" value={id} />
            <input
              type="hidden"
              name="request_id"
              value={crypto.randomUUID()}
            />
            <div className="stack">
              <Field
                label="Amount received"
                name="amount"
                type="number"
                min="0.01"
                max={s.outstanding / 100}
                step="0.01"
                required
              />
              <Field
                label="Payment date"
                name="payment_date"
                type="date"
                defaultValue={localToday(r.organization.timezone)}
                required
              />
              <Field label="Reference / payment method" name="reference" />
              <Submit>Record payment</Submit>
            </div>
          </form>
        )}
        <section className="card">
          <h2>Payment history</h2>
          {r.payments
            .filter((p) => p.invoice_id === id)
            .map((p) => (
              <div className="detail-row" key={p.id}>
                <div>
                  {p.payment_date}
                  <div className="muted">{p.reference}</div>
                </div>
                <strong className="mono">
                  {money(p.amount_cents, r.organization.currency)}
                </strong>
              </div>
            ))}
          {!s.paid && (
            <p className="muted" style={{ fontSize: 13 }}>
              No payments recorded.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
