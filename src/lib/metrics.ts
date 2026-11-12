import { formatInTimeZone } from "date-fns-tz";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  subMonths,
  subDays,
  startOfYear,
  format,
  parseISO,
  differenceInCalendarDays,
} from "date-fns";
import { invoiceTotal, laborCost, profitability, roundRatio } from "./finance";
import type { Records, Job } from "./records";
export function localToday(timezone: string) {
  return formatInTimeZone(new Date(), timezone, "yyyy-MM-dd");
}
export function dateRange(
  period: string,
  timezone: string,
  from?: string,
  to?: string,
) {
  const today = parseISO(localToday(timezone));
  let start = startOfMonth(today),
    end = endOfMonth(today);
  if (period === "week") {
    start = startOfWeek(today, { weekStartsOn: 1 });
    end = endOfWeek(today, { weekStartsOn: 1 });
  } else if (period === "last") {
    start = startOfMonth(subMonths(today, 1));
    end = endOfMonth(start);
  } else if (period === "90") {
    start = subDays(today, 89);
    end = today;
  } else if (period === "year") {
    start = startOfYear(today);
    end = today;
  } else if (
    period === "custom" &&
    from &&
    to &&
    /^\d{4}-\d{2}-\d{2}$/.test(from) &&
    /^\d{4}-\d{2}-\d{2}$/.test(to) &&
    from <= to
  ) {
    return { from, to };
  }
  return { from: format(start, "yyyy-MM-dd"), to: format(end, "yyyy-MM-dd") };
}
export function jobProfit(job: Job, r: Pick<Records, "expenses">) {
  return profitability(
    job.status === "completed"
      ? (job.final_cents ?? job.quoted_cents)
      : job.quoted_cents,
    [
      laborCost(job.actual_minutes, job.labor_rate_cents),
      ...r.expenses
        .filter((e) => e.job_id === job.id)
        .map((e) => e.amount_cents),
    ],
  );
}
export function invoiceSummary(
  invoice: Records["invoices"][number],
  r: Pick<Records, "items" | "payments">,
  today: string,
) {
  const totals = invoiceTotal(
    r.items.filter((i) => i.invoice_id === invoice.id),
    invoice.tax_bps,
  );
  const paid = r.payments
    .filter((p) => p.invoice_id === invoice.id)
    .reduce((s, p) => s + p.amount_cents, 0);
  const outstanding = invoice.status === "voided" ? 0 : totals.total - paid;
  const status =
    invoice.status === "voided"
      ? "voided"
      : paid === totals.total && totals.total > 0
        ? "paid"
        : paid > 0
          ? "partially_paid"
          : invoice.status === "sent" && invoice.due_date < today
            ? "overdue"
            : invoice.status;
  return { ...totals, paid, outstanding, status };
}
export function metrics(r: Records, from: string, to: string) {
  const within = (date: string) => date >= from && date <= to;
  const jobs = r.jobs.filter(
    (j) =>
      j.status === "completed" &&
      j.completed_at &&
      within(
        formatInTimeZone(j.completed_at, r.organization.timezone, "yyyy-MM-dd"),
      ),
  );
  const revenue = jobs.reduce(
    (s, j) => s + (j.final_cents ?? j.quoted_cents),
    0,
  );
  const expenses = r.expenses
    .filter((e) => within(e.expense_date))
    .reduce((s, e) => s + e.amount_cents, 0);
  const labor = jobs.reduce(
    (s, j) => s + laborCost(j.actual_minutes, j.labor_rate_cents),
    0,
  );
  const profit = profitability(revenue, [expenses, labor]);
  const cash = r.payments
    .filter((p) => within(p.payment_date))
    .reduce((s, p) => s + p.amount_cents, 0);
  return {
    ...profit,
    expenses,
    labor,
    cash,
    jobs,
    average: jobs.length ? roundRatio(BigInt(revenue), BigInt(jobs.length)) : 0,
  };
}

export function previousRange(from: string, to: string) {
  const days = differenceInCalendarDays(parseISO(to), parseISO(from)) + 1;
  return {
    from: format(subDays(parseISO(from), days), "yyyy-MM-dd"),
    to: format(subDays(parseISO(from), 1), "yyyy-MM-dd"),
  };
}
export function growth(current: number, previous: number) {
  return previous > 0
    ? `${(((current - previous) / previous) * 100).toFixed(1)}%`
    : null;
}
