import { records } from "@/lib/records";
import { Heading, Empty } from "@/components/shared";
import { JobForm } from "@/components/business-forms";
import { Feedback } from "@/components/forms";
import { localToday } from "@/lib/metrics";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ copy?: string; error?: string }>;
}) {
  const r = await records(),
    p = await searchParams;
  return (
    <>
      <Heading
        title="Schedule a job"
        description={`Make room for good work. Times are in ${r.organization.timezone}.`}
      />
      <Feedback params={p} />
      {r.customers.some((c) => !c.archived) ? (
        <JobForm
          customers={r.customers}
          services={r.services}
          today={localToday(r.organization.timezone)}
          job={r.jobs.find((j) => j.id === p.copy)}
          duplicate
        />
      ) : (
        <section className="card">
          <Empty
            title="First, add a customer"
            description="Every job belongs to a customer so its history stays connected."
            href="/app/customers/new"
            action="Add customer"
          />
        </section>
      )}
    </>
  );
}
