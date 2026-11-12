import Link from "next/link";
import {
  ArrowUpRight,
  DollarSign,
  Receipt,
  TrendingUp,
  Percent,
  ArrowRight,
} from "lucide-react";
import { records } from "@/lib/records";
import {
  metrics,
  dateRange,
  localToday,
  invoiceSummary,
  previousRange,
  growth,
  jobProfit,
} from "@/lib/metrics";
import { money } from "@/lib/finance";
import { Heading, Empty, Badge, RangeFilter } from "@/components/shared";
import { LazyChart } from "@/components/lazy-chart";
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  parseISO,
} from "date-fns";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const r = await records(),
    p = await searchParams;
  const range = dateRange(
    p.period || "month",
    r.organization.timezone,
    p.from,
    p.to,
  );
  const m = metrics(r, range.from, range.to);
  const previous = previousRange(range.from, range.to);
  const prior = metrics(r, previous.from, previous.to);
  const bestServices = r.services
    .map((s) => ({
      name: s.name,
      profit: m.jobs
        .filter((j) => j.service_id === s.id)
        .reduce((sum, j) => sum + jobProfit(j, r).profit, 0),
      count: m.jobs.filter((j) => j.service_id === s.id).length,
    }))
    .filter((s) => s.count)
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 4);
  const today = localToday(r.organization.timezone);
  const upcoming = r.jobs
    .filter((j) => j.scheduled_date >= today && j.status === "scheduled")
    .sort((a, b) =>
      (a.scheduled_date + a.start_time).localeCompare(
        b.scheduled_date + b.start_time,
      ),
    )
    .slice(0, 4);
  const recent = [...r.jobs]
    .sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date))
    .slice(0, 5);
  const outstanding = r.invoices
    .filter((i) => i.status !== "draft")
    .reduce((s, i) => s + invoiceSummary(i, r, today).outstanding, 0);
  const chart = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(parseISO(today), 5 - i);
    const monthly = metrics(
      r,
      format(startOfMonth(date), "yyyy-MM-dd"),
      format(endOfMonth(date), "yyyy-MM-dd"),
    );
    return {
      month: format(date, "MMM"),
      revenue: monthly.revenue,
      expenses: monthly.cost,
    };
  });
  const stat = [
    ["Job revenue", m.revenue, "Completed job charges", DollarSign],
    ["Expenses + labor", m.cost, "Recorded costs & labor allowance", Receipt],
    [
      "Est. operating profit",
      m.profit,
      "Before unrecorded overhead & taxes",
      TrendingUp,
    ],
    [
      "Profit margin",
      m.marginBasisPoints,
      "Profit ÷ completed job revenue",
      Percent,
    ],
  ] as const;
  return (
    <>
      <Heading
        title="Business overview"
        description="A clear picture of your work. A better handle on your numbers."
        action="New job"
        href="/app/jobs/new"
      />
      <RangeFilter {...p} />
      <div className="stats">
        {stat.map(([label, v, note, Icon], i) => (
          <section className="card" key={label}>
            <div className="stat-label">
              {label}
              <Icon size={16} />
            </div>
            <div className={`stat-value mono ${i === 2 ? "positive" : ""}`}>
              {i === 3
                ? v === null
                  ? "—"
                  : `${(v / 100).toFixed(1)}%`
                : money(v ?? 0, r.organization.currency)}
            </div>
            <div className="stat-note">{note}</div>
          </section>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="card">
          <div className="section-head">
            <div>
              <h2>Revenue & expenses</h2>
              <p className="muted" style={{ fontSize: 12, margin: "6px 0 0" }}>
                Your business performance over the last 6 months
              </p>
            </div>
            <div style={{ fontSize: 10, color: "#66716a" }}>
              ● Revenue &nbsp; <span style={{ color: "#9c6c20" }}>● Costs</span>
            </div>
          </div>
          {r.jobs.length || r.expenses.length ? (
            <LazyChart data={chart} currency={r.organization.currency} />
          ) : (
            <div className="chart-empty">
              <Empty
                title="Your progress starts here"
                description="Complete a job and record its costs to see your business take shape."
                href="/app/jobs/new"
                action="Schedule your first job"
              />
            </div>
          )}
        </section>
        <section className="card">
          <div className="section-head">
            <h2>Coming up</h2>
            <Link className="text-link" href="/app/calendar">
              Calendar <ArrowUpRight size={14} />
            </Link>
          </div>
          {upcoming.length ? (
            upcoming.map((j) => (
              <Link
                className="schedule-row"
                key={j.id}
                href={`/app/jobs/${j.id}`}
              >
                <div className="date-box">
                  {format(new Date(j.scheduled_date + "T12:00"), "MMM")}
                  <strong>{j.scheduled_date.slice(8)}</strong>
                </div>
                <div>
                  <h3>{j.description}</h3>
                  <p>
                    {r.customers.find((c) => c.id === j.customer_id)?.name} ·{" "}
                    {j.start_time.slice(0, 5)}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <Empty
              title="A little room on the calendar"
              description="Your next scheduled jobs will appear here."
              href="/app/jobs/new"
              action="Add a job"
            />
          )}
        </section>
      </div>
      <div className="dashboard-grid">
        <section className="card">
          <div className="section-head">
            <h2>Recent jobs</h2>
            <Link className="text-link" href="/app/jobs">
              All jobs <ArrowRight size={14} />
            </Link>
          </div>
          {recent.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Job / customer</th>
                    <th>Date</th>
                    <th>Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((j) => (
                    <tr key={j.id}>
                      <td>
                        <Link href={`/app/jobs/${j.id}`}>{j.description}</Link>
                        <div
                          className="muted"
                          style={{ fontSize: 11, marginTop: 5 }}
                        >
                          {
                            r.customers.find((c) => c.id === j.customer_id)
                              ?.name
                          }
                        </div>
                      </td>
                      <td>{j.scheduled_date}</td>
                      <td className="mono">
                        {money(
                          j.final_cents ?? j.quoted_cents,
                          r.organization.currency,
                        )}
                      </td>
                      <td>
                        <Badge status={j.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="Let’s put your first job on the board"
              description="Keep every detail, cost, and customer together in one place."
              href="/app/jobs/new"
              action="Create a job"
            />
          )}
        </section>
        <section className="card" style={{ background: "#edf2e9" }}>
          <div className="eyebrow">THE NUMBERS THAT MATTER</div>
          <h2 style={{ margin: "15px 0 20px" }}>More than a busy schedule.</h2>
          <div className="detail-row">
            <span>Cash received in period</span>
            <strong className="mono">
              {money(m.cash, r.organization.currency)}
            </strong>
          </div>
          <div className="detail-row">
            <span>Outstanding invoices · all dates</span>
            <strong className="mono">
              {money(outstanding, r.organization.currency)}
            </strong>
          </div>
          <div className="detail-row">
            <span>Jobs completed in period</span>
            <strong>{m.jobs.length}</strong>
          </div>
          <div className="detail-row">
            <span>Active customers · all dates</span>
            <strong>{r.customers.filter((c) => !c.archived).length}</strong>
          </div>
          <div className="detail-row">
            <span>Average completed job</span>
            <strong className="mono">
              {money(m.average, r.organization.currency)}
            </strong>
          </div>
          <Link
            className="text-link"
            style={{ marginTop: 20 }}
            href="/app/analytics"
          >
            Understand your profit <ArrowRight size={14} />
          </Link>
        </section>
      </div>
      <div className="details">
        <section className="card">
          <h2>Compared with the previous period</h2>
          <div className="detail-row">
            <span>Revenue growth</span>
            <strong className="mono">
              {growth(m.revenue, prior.revenue) ?? "—"}
            </strong>
          </div>
          <div className="detail-row">
            <span>Profit growth</span>
            <strong className="mono">
              {growth(m.profit, prior.profit) ?? "—"}
            </strong>
          </div>
          <p className="definition">
            Comparison: {previous.from} – {previous.to}, the same number of
            calendar days. Growth is omitted when the previous value is zero or
            negative.
          </p>
        </section>
        <section className="card">
          <h2>Best-performing services</h2>
          {bestServices.length ? (
            bestServices.map((s) => (
              <div className="detail-row" key={s.name}>
                <span>
                  {s.name} · {s.count} jobs
                </span>
                <strong className="mono">
                  {money(s.profit, r.organization.currency)}
                </strong>
              </div>
            ))
          ) : (
            <p className="muted" style={{ fontSize: 13 }}>
              Complete a categorized job to compare service profitability.
            </p>
          )}
        </section>
      </div>
      <p className="definition">
        Job revenue is recognized on completion in {r.organization.timezone};
        cash received is recorded separately by payment date. Expenses use their
        recorded dates. Labor is a cost allowance captured on each completed
        job. Estimated operating profit excludes unrecorded overhead, taxes, and
        owner compensation. {range.from} – {range.to}.
      </p>
    </>
  );
}
