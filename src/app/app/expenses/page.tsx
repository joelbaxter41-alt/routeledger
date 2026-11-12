import Link from "next/link";
import { records } from "@/lib/records";
import { Heading, Empty } from "@/components/shared";
import { ExpenseForm } from "@/components/business-forms";
import { Feedback } from "@/components/forms";
import { money } from "@/lib/finance";
import { localToday } from "@/lib/metrics";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    edit?: string;
    category?: string;
    from?: string;
    to?: string;
    error?: string;
    success?: string;
  }>;
}) {
  const r = await records(),
    p = await searchParams;
  const expenses = r.expenses
    .filter(
      (e) =>
        (!p.category || e.category === p.category) &&
        (!p.from || e.expense_date >= p.from) &&
        (!p.to || e.expense_date <= p.to),
    )
    .sort((a, b) => b.expense_date.localeCompare(a.expense_date));
  return (
    <>
      <Heading
        title="Expenses"
        description="Small costs add up. Keep every dollar in view."
      />
      <Feedback params={p} />
      <form className="actions" style={{ marginBottom: 22 }}>
        <label className="field">
          From
          <input
            className="filter-input"
            name="from"
            type="date"
            defaultValue={p.from}
          />
        </label>
        <label className="field">
          To
          <input
            className="filter-input"
            name="to"
            type="date"
            defaultValue={p.to}
          />
        </label>
        <label className="field">
          Category
          <select
            className="filter-input"
            name="category"
            defaultValue={p.category || ""}
          >
            <option value="">All categories</option>
            {[
              "fuel",
              "equipment",
              "maintenance",
              "materials",
              "labor",
              "vehicle",
              "insurance",
              "software",
              "advertising",
              "supplies",
              "other",
            ].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <button className="button outline" style={{ alignSelf: "end" }}>
          Filter
        </button>
      </form>
      <section className="card" style={{ marginBottom: 22 }}>
        <div className="section-head">
          <h2>
            {money(
              expenses.reduce((s, e) => s + e.amount_cents, 0),
              r.organization.currency,
            )}{" "}
            recorded
          </h2>
          <Link
            className="text-link"
            href={`/app/export?type=expenses&from=${p.from || ""}&to=${p.to || ""}&category=${p.category || ""}`}
          >
            Export CSV · Pro
          </Link>
        </div>
        {expenses.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Vendor</th>
                  <th>Category</th>
                  <th>Allocation</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td>{e.expense_date}</td>
                    <td>{e.vendor}</td>
                    <td>{e.category}</td>
                    <td>
                      {e.job_id ? (
                        <Link href={`/app/jobs/${e.job_id}`}>
                          {r.jobs.find((j) => j.id === e.job_id)?.description}
                        </Link>
                      ) : (
                        "Overhead"
                      )}
                    </td>
                    <td className="mono">
                      {money(e.amount_cents, r.organization.currency)}
                    </td>
                    <td>
                      <Link className="text-link" href={`?edit=${e.id}`}>
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Give every expense a home"
            description="Record fuel, materials, and overhead to get a more honest picture of profit."
          />
        )}
      </section>
      <ExpenseForm
        expense={r.expenses.find((e) => e.id === p.edit)}
        jobs={r.jobs}
        today={localToday(r.organization.timezone)}
      />
    </>
  );
}
