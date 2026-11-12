import Link from "next/link";
import { CalendarDays, ArrowUpRight } from "lucide-react";
import type { Job, Customer, Expense } from "@/lib/records";
import { money } from "@/lib/finance";
import { jobProfit } from "@/lib/metrics";
import { Badge } from "./shared";
export function JobBoard({
  jobs,
  customers,
  expenses,
  currency,
}: {
  jobs: Job[];
  customers: Customer[];
  expenses: Expense[];
  currency: string;
}) {
  const statuses = [
    ["draft", "Draft"],
    ["scheduled", "Scheduled"],
    ["in_progress", "In progress"],
    ["completed", "Completed"],
  ] as const;
  const canceled = jobs.filter((j) => j.status === "canceled").length;
  return (
    <>
      <div className="job-board">
        {statuses.map(([status, title]) => {
          const column = jobs.filter((j) => j.status === status);
          return (
            <section
              className="job-board-column"
              key={status}
              aria-label={`${title} jobs`}
            >
              <header>
                <strong>{title}</strong>
                <span>{column.length}</span>
              </header>
              {column.length ? (
                column.map((j) => (
                  <Link
                    className="job-board-card"
                    key={j.id}
                    href={`/app/jobs/${j.id}`}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <Badge status={j.status} />
                      <ArrowUpRight size={13} color="#627b60" />
                    </div>
                    <h2>{j.description}</h2>
                    <p>{customers.find((c) => c.id === j.customer_id)?.name}</p>
                    <p
                      style={{ display: "flex", gap: 6, alignItems: "center" }}
                    >
                      <CalendarDays size={12} />
                      {j.scheduled_date} · {j.start_time.slice(0, 5)}
                    </p>
                    <footer>
                      <span>
                        {j.status === "completed"
                          ? "Est. profit"
                          : "Agreed charge"}
                      </span>
                      <strong className="mono">
                        {money(
                          j.status === "completed"
                            ? jobProfit(j, { expenses }).profit
                            : j.quoted_cents,
                          currency,
                        )}
                      </strong>
                    </footer>
                  </Link>
                ))
              ) : (
                <div className="job-board-empty">
                  No {title.toLowerCase()} jobs
                </div>
              )}
            </section>
          );
        })}
      </div>
      {canceled > 0 && (
        <p className="job-board-canceled">
          {canceled} canceled {canceled === 1 ? "job" : "jobs"} retained in
          history.{" "}
          <Link
            className="text-link"
            href="/app/jobs?view=list&status=canceled"
          >
            View canceled jobs
          </Link>
        </p>
      )}
    </>
  );
}
