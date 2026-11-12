import Link from "next/link";
import { Plus, ArrowRight, Inbox } from "lucide-react";
export function Heading({
  title,
  description,
  action,
  href,
}: {
  title: string;
  description: string;
  action?: string;
  href?: string;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {action && href && (
        <Link className="button primary" href={href}>
          <Plus size={16} />
          {action}
        </Link>
      )}
    </div>
  );
}
export function Empty({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="empty">
      <Inbox size={30} />
      <h3>{title}</h3>
      <p>{description}</p>
      {href && (
        <Link className="text-link" href={href}>
          {action || "Get started"} <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}
export function Badge({ status }: { status: string }) {
  return (
    <span className={`badge ${status}`}>{status.replaceAll("_", " ")}</span>
  );
}
export function RangeFilter({
  period = "month",
  from,
  to,
}: {
  period?: string;
  from?: string;
  to?: string;
}) {
  return (
    <form
      className="actions no-print"
      style={{ alignItems: "end", marginBottom: 22 }}
    >
      <label className="field">
        Period
        <select name="period" defaultValue={period} className="filter-input">
          <option value="week">This week</option>
          <option value="month">This month</option>
          <option value="last">Last month</option>
          <option value="90">Last 90 days</option>
          <option value="year">This year</option>
          <option value="custom">Custom dates</option>
        </select>
      </label>
      <label className="field">
        From
        <input
          className="filter-input"
          name="from"
          type="date"
          defaultValue={from}
        />
      </label>
      <label className="field">
        To
        <input
          className="filter-input"
          name="to"
          type="date"
          defaultValue={to}
        />
      </label>
      <button className="button outline">Apply</button>
    </form>
  );
}
