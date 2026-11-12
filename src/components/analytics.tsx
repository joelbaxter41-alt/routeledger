import { records } from "@/lib/records";
import { Heading, RangeFilter, Empty } from "./shared";
import {
  dateRange,
  metrics,
  jobProfit,
  localToday,
  invoiceSummary,
} from "@/lib/metrics";
import { money } from "@/lib/finance";
import {
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
  format,
  parseISO,
} from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import Link from "next/link";
import { PrintButton } from "./print-button";
export async function Analytics({
  params,
  report = false,
}: {
  params: Promise<{ period?: string; from?: string; to?: string }>;
  report?: boolean;
}) {
  const r = await records(),
    p = await params,
    range = dateRange(
      p.period || "month",
      r.organization.timezone,
      p.from,
      p.to,
    ),
    m = metrics(r, range.from, range.to);
  const tables = [
    {
      title: "Profit by service",
      rows: [
        ...r.services.map((s) => ({
          name: s.name,
          jobs: m.jobs.filter((j) => j.service_id === s.id),
        })),
        { name: "Custom service", jobs: m.jobs.filter((j) => !j.service_id) },
      ],
    },
    {
      title: "Profit by customer",
      rows: r.customers.map((c) => ({
        name: c.name,
        jobs: m.jobs.filter((j) => j.customer_id === c.id),
      })),
    },
  ];
  const months = eachMonthOfInterval({
    start: parseISO(range.from),
    end: parseISO(range.to),
  }).slice(0, 120);
  const outstanding = r.invoices
    .filter((i) => i.status !== "draft" && i.status !== "voided")
    .map((i) => ({
      invoice: i,
      ...invoiceSummary(i, r, localToday(r.organization.timezone)),
    }))
    .filter((i) => i.outstanding > 0);
  return (
    <>
      <Heading
        title={report ? "Reports" : "Profit analytics"}
        description="Busy is good. Profitable is better. Understand what your work really earns."
      />
      <RangeFilter {...p} />
      <div className="actions no-print" style={{ marginBottom: 22 }}>
        <Link
          className="button primary"
          href={`/app/export?type=profit&from=${range.from}&to=${range.to}`}
        >
          Export job profit CSV · Pro
        </Link>
        <Link
          className="button outline"
          href={`/app/export?type=expenses&from=${range.from}&to=${range.to}`}
        >
          Export expenses CSV · Pro
        </Link>
        <PrintButton />
      </div>
      <div className="stats">
        {[
          ["Completed job revenue", m.revenue],
          ["Expenses + labor", m.cost],
          ["Est. operating profit", m.profit],
          ["Cash received", m.cash],
        ].map(([label, v]) => (
          <section className="card" key={label}>
            <div className="stat-label">{label}</div>
            <div className="stat-value mono">
              {money(Number(v), r.organization.currency)}
            </div>
          </section>
        ))}
      </div>
      <section className="card" style={{ marginBottom: 22 }}>
        <h2>Monthly performance</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Revenue</th>
                <th>Expenses + labor</th>
                <th>Est. profit</th>
                <th>Jobs</th>
                <th>Avg. job value</th>
                <th>New customers</th>
              </tr>
            </thead>
            <tbody>
              {months.map((date) => {
                const from =
                  format(date, "yyyy-MM-dd") < range.from
                    ? range.from
                    : format(startOfMonth(date), "yyyy-MM-dd");
                const to =
                  format(endOfMonth(date), "yyyy-MM-dd") > range.to
                    ? range.to
                    : format(endOfMonth(date), "yyyy-MM-dd");
                const data = metrics(r, from, to);
                const customers = r.customers.filter((c) => {
                  const day = formatInTimeZone(
                    c.created_at,
                    r.organization.timezone,
                    "yyyy-MM-dd",
                  );
                  return day >= from && day <= to;
                }).length;
                return (
                  <tr key={from}>
                    <td>{format(date, "MMM yyyy")}</td>
                    <td className="mono">
                      {money(data.revenue, r.organization.currency)}
                    </td>
                    <td className="mono">
                      {money(data.cost, r.organization.currency)}
                    </td>
                    <td className="mono">
                      {money(data.profit, r.organization.currency)}
                    </td>
                    <td>{data.jobs.length}</td>
                    <td className="mono">
                      {money(data.average, r.organization.currency)}
                    </td>
                    <td>{customers}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="definition">
          First 120 months of the selected range. Partial months respect your
          date boundaries.
        </p>
      </section>
      <div className="details">
        {tables.map((t) => (
          <section className="card" key={t.title}>
            <h2>{t.title}</h2>
            {t.rows.some((row) => row.jobs.length) ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Jobs</th>
                      <th>Revenue</th>
                      <th>Job profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {t.rows
                      .filter((row) => row.jobs.length)
                      .map((row) => (
                        <tr key={row.name}>
                          <td>{row.name}</td>
                          <td>{row.jobs.length}</td>
                          <td className="mono">
                            {money(
                              row.jobs.reduce(
                                (s, j) => s + (j.final_cents ?? j.quoted_cents),
                                0,
                              ),
                              r.organization.currency,
                            )}
                          </td>
                          <td className="mono">
                            {money(
                              row.jobs.reduce(
                                (s, j) => s + jobProfit(j, r).profit,
                                0,
                              ),
                              r.organization.currency,
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty
                title="Your insights are on their way"
                description="Complete jobs and allocate costs to compare profitability."
              />
            )}
          </section>
        ))}
      </div>
      <section className="card" style={{ marginTop: 22 }}>
        <h2>Expense category breakdown</h2>
        {[
          ...new Set(
            r.expenses
              .filter(
                (e) =>
                  e.expense_date >= range.from && e.expense_date <= range.to,
              )
              .map((e) => e.category),
          ),
        ].map((c) => (
          <div className="detail-row" key={c}>
            <span>{c}</span>
            <strong className="mono">
              {money(
                r.expenses
                  .filter(
                    (e) =>
                      e.category === c &&
                      e.expense_date >= range.from &&
                      e.expense_date <= range.to,
                  )
                  .reduce((s, e) => s + e.amount_cents, 0),
                r.organization.currency,
              )}
            </strong>
          </div>
        ))}
        {!r.expenses.length && (
          <p className="muted">No recorded expenses yet.</p>
        )}
      </section>
      <section className="card" style={{ marginTop: 22 }}>
        <h2>Outstanding invoices · all dates</h2>
        {outstanding.length ? (
          outstanding.map((i) => (
            <div className="detail-row" key={i.invoice.id}>
              <Link href={`/app/invoices/${i.invoice.id}`}>
                INV-{String(i.invoice.number).padStart(4, "0")} ·{" "}
                {i.invoice.customer_name}
              </Link>
              <span>Due {i.invoice.due_date}</span>
              <strong className="mono">
                {money(i.outstanding, r.organization.currency)}
              </strong>
            </div>
          ))
        ) : (
          <p className="muted">No outstanding sent invoices.</p>
        )}
      </section>
      <p className="definition">
        Period: {range.from} – {range.to}. Revenue: completed charges by
        organization-local completion date. Costs: dated expenses plus labor
        allowance on completed jobs. Job/customer/service profit allocates
        job-linked costs and labor only, excluding overhead. Overall operating
        profit deducts overhead once. Cash received comes from manual payments,
        separately from revenue. Customer growth counts newly created customer
        records; average job value = completed revenue ÷ completed count.
        Figures exclude unrecorded costs and taxes. This release does not
        provide an accounting ledger or tax determination.
      </p>
    </>
  );
}
