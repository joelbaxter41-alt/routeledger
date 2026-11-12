import Link from "next/link";
import { notFound } from "next/navigation";
import { records } from "@/lib/records";
import { Heading, Badge } from "@/components/shared";
import { CustomerForm } from "@/components/business-forms";
import { Feedback } from "@/components/forms";
import { archiveCustomer } from "@/app/actions";
import { Submit } from "@/components/submit";
import { jobProfit } from "@/lib/metrics";
import { money } from "@/lib/finance";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const r = await records(),
    { id } = await params,
    c = r.customers.find((c) => c.id === id);
  if (!c) notFound();
  const jobs = r.jobs.filter((j) => j.customer_id === id);
  return (
    <>
      <Heading
        title={c.name}
        description={`${jobs.length} jobs · ${c.archived ? "Archived customer" : "Active customer"}`}
      />
      <Feedback params={await searchParams} />
      <CustomerForm customer={c} />
      <section className="card" style={{ marginTop: 22 }}>
        <h2>Job history & profitability</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Job</th>
                <th>Date</th>
                <th>Status</th>
                <th>Estimated profit</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id}>
                  <td>
                    <Link href={`/app/jobs/${j.id}`}>{j.description}</Link>
                  </td>
                  <td>{j.scheduled_date}</td>
                  <td>
                    <Badge status={j.status} />
                  </td>
                  <td className="mono">
                    {j.status === "completed"
                      ? money(jobProfit(j, r).profit, r.organization.currency)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <form action={archiveCustomer} style={{ marginTop: 20 }}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="archived" value={String(!c.archived)} />
        <Submit>{c.archived ? "Restore customer" : "Archive customer"}</Submit>
        <p className="definition">
          Archival preserves related jobs, invoices, and payments.
        </p>
      </form>
    </>
  );
}
