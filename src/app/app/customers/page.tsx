import Link from "next/link";
import { records } from "@/lib/records";
import { money } from "@/lib/finance";
import { invoiceSummary, localToday } from "@/lib/metrics";
import { Heading, Empty, Badge } from "@/components/shared";
import { Feedback } from "@/components/forms";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    error?: string;
    success?: string;
  }>;
}) {
  const r = await records(),
    p = await searchParams;
  const customers = r.customers.filter(
    (c) =>
      (p.status === "archived" ? c.archived : !c.archived) &&
      (!p.q ||
        `${c.name} ${c.email} ${c.phone}`
          .toLowerCase()
          .includes(p.q.toLowerCase())),
  );
  return (
    <>
      <Heading
        title="Customers"
        description="Good relationships. Great repeat business."
        action="Add customer"
        href="/app/customers/new"
      />
      <Feedback params={p} />
      <form className="actions" style={{ marginBottom: 20 }}>
        <input
          className="filter-input"
          style={{ maxWidth: 320 }}
          name="q"
          aria-label="Search customers"
          placeholder="Search name, email, or phone"
          defaultValue={p.q}
        />
        <select
          className="filter-input"
          style={{ maxWidth: 170 }}
          name="status"
          aria-label="Customer status"
          defaultValue={p.status || "active"}
        >
          <option value="active">Active customers</option>
          <option value="archived">Archived</option>
        </select>
        <button className="button outline">Filter</button>
      </form>
      <section className="card">
        {customers.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Jobs</th>
                  <th>Invoiced</th>
                  <th>Paid</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => {
                  const invoices = r.invoices.filter(
                    (i) => i.customer_id === c.id && i.status !== "voided",
                  );
                  return (
                    <tr key={c.id}>
                      <td>
                        <Link href={`/app/customers/${c.id}`}>{c.name}</Link>
                      </td>
                      <td>{c.email || c.phone || "—"}</td>
                      <td>
                        {r.jobs.filter((j) => j.customer_id === c.id).length}
                      </td>
                      <td className="mono">
                        {money(
                          invoices.reduce(
                            (s, i) =>
                              s +
                              invoiceSummary(
                                i,
                                r,
                                localToday(r.organization.timezone),
                              ).total,
                            0,
                          ),
                          r.organization.currency,
                        )}
                      </td>
                      <td className="mono">
                        {money(
                          r.payments
                            .filter((x) =>
                              invoices.some((i) => i.id === x.invoice_id),
                            )
                            .reduce((s, x) => s + x.amount_cents, 0),
                          r.organization.currency,
                        )}
                      </td>
                      <td>
                        <Badge status={c.archived ? "archived" : "active"} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Know the people behind the work"
            description="Add your first customer to keep contact details, jobs, and invoices together."
            href="/app/customers/new"
            action="Add a customer"
          />
        )}
      </section>
    </>
  );
}
