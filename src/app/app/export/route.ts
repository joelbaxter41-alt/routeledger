import { records } from "@/lib/records";
import { jobProfit, metrics } from "@/lib/metrics";
export function csvCell(value: unknown) {
  let s = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replaceAll('"', '""')}"`;
}
export async function GET(request: Request) {
  const r = await records();
  if (
    !r.subscription?.verified_at ||
    !["active", "trialing"].includes(r.subscription.status) ||
    new Date(r.subscription.period_end) <= new Date()
  )
    return new Response("Solo Pro required", { status: 403 });
  if (!["owner", "admin"].includes(r.role))
    return new Response("Manager permissions required", { status: 403 });
  const q = new URL(request.url).searchParams,
    from = q.get("from") || "0001-01-01",
    to = q.get("to") || "9999-12-31";
  const type = q.get("type");
  let rows: unknown[][];
  if (type === "expenses")
    rows = [
      [
        "Date",
        "Vendor",
        "Description",
        "Category",
        "Amount (minor units)",
        "Currency",
        "Job ID",
      ],
      ...r.expenses
        .filter(
          (e) =>
            e.expense_date >= from &&
            e.expense_date <= to &&
            (!q.get("category") || e.category === q.get("category")),
        )
        .map((e) => [
          e.expense_date,
          e.vendor,
          e.description,
          e.category,
          e.amount_cents,
          r.organization.currency,
          e.job_id,
        ]),
    ];
  else
    rows = [
      [
        "Job",
        "Date",
        "Revenue (minor units)",
        "Cost (minor units)",
        "Est. profit (minor units)",
        "Margin (basis points)",
        "Currency",
      ],
      ...metrics(r, from, to).jobs.map((j) => {
        const p = jobProfit(j, r);
        return [
          j.description,
          j.scheduled_date,
          p.revenue,
          p.cost,
          p.profit,
          p.marginBasisPoints,
          r.organization.currency,
        ];
      }),
    ];
  return new Response(
    rows.map((row) => row.map(csvCell).join(",")).join("\r\n"),
    {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="routeledger-${type === "expenses" ? "expenses" : "profit"}.csv"`,
        "Cache-Control": "no-store",
      },
    },
  );
}
