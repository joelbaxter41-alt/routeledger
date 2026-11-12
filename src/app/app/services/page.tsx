import Link from "next/link";
import { records } from "@/lib/records";
import { Heading, Empty } from "@/components/shared";
import { ServiceForm } from "@/components/business-forms";
import { Feedback } from "@/components/forms";
import { money } from "@/lib/finance";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; error?: string; success?: string }>;
}) {
  const r = await records(),
    p = await searchParams;
  return (
    <>
      <Heading
        title="Services & pricing"
        description="A clear starting point for every quote. Your agreed job rates stay yours."
      />
      <Feedback params={p} />
      <section className="card" style={{ marginBottom: 22 }}>
        {r.services.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Default price</th>
                  <th>Duration</th>
                  <th>Labor / hr</th>
                  <th>Target margin</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {r.services.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td className="mono">
                      {money(s.default_cents, r.organization.currency)}
                    </td>
                    <td>{s.duration_minutes} min</td>
                    <td>
                      {money(s.labor_rate_cents, r.organization.currency)}
                    </td>
                    <td>{s.target_bps / 100}%</td>
                    <td>
                      <Link className="text-link" href={`?edit=${s.id}`}>
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
            title="Define the work you do best"
            description="Create service rates and labor assumptions to make pricing more consistent."
          />
        )}
      </section>
      <ServiceForm service={r.services.find((s) => s.id === p.edit)} />
    </>
  );
}
