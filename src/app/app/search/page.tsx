import Link from "next/link";
import { records } from "@/lib/records";
import { Heading, Empty } from "@/components/shared";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const r = await records(),
    { q = "" } = await searchParams;
  const query = q.slice(0, 200).toLowerCase();
  const customers = query
    ? r.customers.filter((c) =>
        `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(query),
      )
    : [];
  const jobs = query
    ? r.jobs.filter((j) => j.description.toLowerCase().includes(query))
    : [];
  return (
    <>
      <Heading
        title="Search"
        description={`Results for “${q.slice(0, 200)}”`}
      />
      <div className="card">
        <h2>Customers</h2>
        {customers.map((c) => (
          <div className="detail-row" key={c.id}>
            <Link className="text-link" href={`/app/customers/${c.id}`}>
              {c.name}
            </Link>
          </div>
        ))}
        <h2 style={{ marginTop: 25 }}>Jobs</h2>
        {jobs.map((j) => (
          <div className="detail-row" key={j.id}>
            <Link className="text-link" href={`/app/jobs/${j.id}`}>
              {j.description} · {j.scheduled_date}
            </Link>
          </div>
        ))}
        {!customers.length && !jobs.length && (
          <Empty
            title="No matches"
            description="Try a customer name or a job description."
          />
        )}
      </div>
    </>
  );
}
