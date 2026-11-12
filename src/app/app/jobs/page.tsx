import Link from "next/link";
import { List, Columns3 } from "lucide-react";
import { JobBoard } from "@/components/job-board";
import { records } from "@/lib/records";
import { Heading, Empty, Badge } from "@/components/shared";
import { Feedback } from "@/components/forms";
import { money } from "@/lib/finance";
import { jobProfit } from "@/lib/metrics";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    status?: string;
    q?: string;
    error?: string;
    success?: string;
  }>;
}) {
  const r = await records(),
    p = await searchParams;
  const jobs = r.jobs
    .filter(
      (j) =>
        (!p.status || j.status === p.status) &&
        (!p.q || j.description.toLowerCase().includes(p.q.toLowerCase())),
    )
    .sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date));
  return (
    <>
      <Heading
        title="Jobs"
        description="Every job, from the first quote to the final dollar."
        action="New job"
        href="/app/jobs/new"
      />
      <Feedback params={p} />
      <div
        className="actions"
        style={{
          justifyContent: "space-between",
          marginBottom: 20,
          alignItems: "center",
        }}
      >
        <nav className="job-view-controls" aria-label="Job display">
          <Link
            className={p.view === "board" ? "" : "active"}
            href={`?${new URLSearchParams({ view: "list", q: p.q || "", status: p.status || "" })}`}
            aria-current={p.view !== "board" ? "page" : undefined}
          >
            <List size={14} />
            List
          </Link>
          <Link
            className={p.view === "board" ? "active" : ""}
            href={`?${new URLSearchParams({ view: "board", q: p.q || "", status: p.status || "" })}`}
            aria-current={p.view === "board" ? "page" : undefined}
          >
            <Columns3 size={14} />
            Board
          </Link>
        </nav>
      </div>
      <form className="actions" style={{ marginBottom: 20 }}>
        <input type="hidden" name="view" value={p.view || "list"} />
        <input
          name="q"
          className="filter-input"
          style={{ maxWidth: 320 }}
          aria-label="Search jobs"
          placeholder="Search jobs"
          defaultValue={p.q}
        />
        <select
          name="status"
          className="filter-input"
          style={{ maxWidth: 180 }}
          aria-label="Job status"
          defaultValue={p.status || ""}
        >
          <option value="">All statuses</option>
          {["draft", "scheduled", "in_progress", "completed", "canceled"].map(
            (s) => (
              <option value={s} key={s}>
                {s.replaceAll("_", " ")}
              </option>
            ),
          )}
        </select>
        <button className="button outline">Filter</button>
      </form>
      {p.view === "board" ? (
        <JobBoard
          jobs={jobs}
          customers={r.customers}
          expenses={r.expenses}
          currency={r.organization.currency}
        />
      ) : (
        <section className="card">
          {jobs.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Customer</th>
                    <th>Schedule</th>
                    <th>Charge</th>
                    <th>Est. profit</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j) => (
                    <tr key={j.id}>
                      <td>
                        <Link href={`/app/jobs/${j.id}`}>{j.description}</Link>
                      </td>
                      <td>
                        {r.customers.find((c) => c.id === j.customer_id)?.name}
                      </td>
                      <td>
                        {j.scheduled_date}
                        <div className="muted">{j.start_time.slice(0, 5)}</div>
                      </td>
                      <td className="mono">
                        {money(
                          j.final_cents ?? j.quoted_cents,
                          r.organization.currency,
                        )}
                      </td>
                      <td className="mono">
                        {j.status === "completed"
                          ? money(
                              jobProfit(j, r).profit,
                              r.organization.currency,
                            )
                          : "—"}
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
              title="Your next profitable job starts here"
              description="Schedule a job, record what it costs, and know what you earned."
              href="/app/jobs/new"
              action="Create your first job"
            />
          )}
        </section>
      )}
    </>
  );
}
