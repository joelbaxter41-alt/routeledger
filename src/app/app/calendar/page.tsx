import Link from "next/link";
import { records } from "@/lib/records";
import { Heading, Empty, Badge } from "@/components/shared";
import { localToday } from "@/lib/metrics";
import {
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  parseISO,
  eachDayOfInterval,
} from "date-fns";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string }>;
}) {
  const r = await records(),
    p = await searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(p.date || "")
    ? parseISO(p.date!)
    : parseISO(localToday(r.organization.timezone));
  const view = p.view || "week";
  const start =
    view === "month"
      ? startOfWeek(startOfMonth(date), { weekStartsOn: 1 })
      : view === "day"
        ? date
        : startOfWeek(date, { weekStartsOn: 1 });
  const end =
    view === "month"
      ? endOfWeek(endOfMonth(date), { weekStartsOn: 1 })
      : view === "day"
        ? date
        : endOfWeek(date, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });
  const jobs = r.jobs
    .filter(
      (j) =>
        j.status !== "canceled" &&
        j.scheduled_date >= format(start, "yyyy-MM-dd") &&
        j.scheduled_date <= format(end, "yyyy-MM-dd"),
    )
    .sort((a, b) =>
      (a.scheduled_date + a.start_time).localeCompare(
        b.scheduled_date + b.start_time,
      ),
    );
  return (
    <>
      <Heading
        title="Calendar"
        description={`A schedule that works for you. All times in ${r.organization.timezone}.`}
        action="Schedule job"
        href="/app/jobs/new"
      />
      <form className="actions" style={{ marginBottom: 22 }}>
        <input
          className="filter-input"
          style={{ maxWidth: 180 }}
          type="date"
          name="date"
          aria-label="Calendar date"
          defaultValue={format(date, "yyyy-MM-dd")}
        />
        <select
          className="filter-input"
          style={{ maxWidth: 160 }}
          name="view"
          aria-label="Calendar view"
          defaultValue={view}
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
          <option value="list">Upcoming list</option>
        </select>
        <button className="button outline">Show schedule</button>
        <Link
          className="button outline"
          href={`?view=${view}&date=${format(addDays(date, view === "month" ? -28 : -7), "yyyy-MM-dd")}`}
        >
          Previous
        </Link>
        <Link
          className="button outline"
          href={`?view=${view}&date=${format(addDays(date, view === "month" ? 28 : 7), "yyyy-MM-dd")}`}
        >
          Next
        </Link>
      </form>
      <section className="card">
        <h2>{format(date, "MMMM yyyy")}</h2>
        {view !== "list" && (
          <div
            className="calendar"
            style={view === "day" ? { gridTemplateColumns: "1fr" } : undefined}
          >
            {days.map((day) => (
              <div className="calendar-cell" key={day.toISOString()}>
                <span className="muted">{format(day, "EEE d")}</span>
                {jobs
                  .filter((j) => j.scheduled_date === format(day, "yyyy-MM-dd"))
                  .map((j) => (
                    <Link
                      key={j.id}
                      className="calendar-event"
                      href={`/app/jobs/${j.id}`}
                    >
                      {j.start_time.slice(0, 5)} · {j.description}
                    </Link>
                  ))}
              </div>
            ))}
          </div>
        )}
        <h3 style={{ marginTop: 25 }}>Appointments in this view</h3>
        {jobs.length ? (
          jobs.map((j) => (
            <div className="detail-row" key={j.id}>
              <div>
                <Link href={`/app/jobs/${j.id}`}>
                  <strong>{j.description}</strong>
                </Link>
                <div className="muted" style={{ marginTop: 6 }}>
                  {j.scheduled_date} · {j.start_time.slice(0, 5)} ·{" "}
                  {j.duration_minutes} min
                </div>
              </div>
              <Badge status={j.status} />
              <Link className="text-link" href={`/app/jobs/${j.id}?edit=1`}>
                Open / reschedule
              </Link>
            </div>
          ))
        ) : (
          <Empty
            title="Space for your next job"
            description="Schedule a job and see it here."
            href="/app/jobs/new"
            action="Add job"
          />
        )}
      </section>
    </>
  );
}
