import Link from "next/link";
import { records } from "@/lib/records";
import { invoiceSummary, localToday } from "@/lib/metrics";
import { money } from "@/lib/finance";
import { Heading, Empty, Badge } from "@/components/shared";
import { Feedback } from "@/components/forms";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const r = await records();
  return (
    <>
      <Heading
        title="Invoices"
        description="Your work has value. Keep the money moving."
        action="Create invoice"
        href="/app/invoices/new"
      />
      <Feedback params={await searchParams} />
      <section className="card">
        {r.invoices.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Due</th>
                  <th>Total</th>
                  <th>Outstanding</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[...r.invoices]
                  .sort((a, b) => b.number - a.number)
                  .map((i) => {
                    const s = invoiceSummary(
                      i,
                      r,
                      localToday(r.organization.timezone),
                    );
                    return (
                      <tr key={i.id}>
                        <td>
                          <Link href={`/app/invoices/${i.id}`}>
                            INV-{String(i.number).padStart(4, "0")}
                          </Link>
                        </td>
                        <td>{i.customer_name}</td>
                        <td>{i.due_date}</td>
                        <td className="mono">
                          {money(s.total, r.organization.currency)}
                        </td>
                        <td className="mono">
                          {money(s.outstanding, r.organization.currency)}
                        </td>
                        <td>
                          <Badge status={s.status} />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="From a job well done to a payment received"
            description="Create an invoice, send it to your customer, and record payments as they arrive. Solo Pro required."
            href="/app/invoices/new"
            action="Create an invoice"
          />
        )}
      </section>
    </>
  );
}
