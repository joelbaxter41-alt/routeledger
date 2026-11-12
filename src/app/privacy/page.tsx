import { MarketingNav, MarketingFooter } from "@/components/marketing";
export const metadata = { title: "Privacy" };
export default function Page() {
  return (
    <div className="marketing">
      <MarketingNav />
      <main id="main" className="legal">
        <span className="eyebrow">
          PRE-RELEASE POLICY · OPERATOR REVIEW REQUIRED
        </span>
        <h1 style={{ marginTop: 20 }}>Privacy policy</h1>
        <p>
          RouteLedger processes account information and the business records you
          enter: customer contact details, jobs, costs, estimates, invoices, and
          payments. These records support the features you request.
        </p>
        <h2>Service providers</h2>
        <p>
          When configured, Supabase stores records and manages authentication,
          Vercel hosts the application, Stripe processes subscription billing,
          and Resend delivers transactional messages. Payment card information
          is handled by Stripe. Product analytics are disabled in this release.
        </p>
        <h2>Your choices</h2>
        <p>
          Business managers can update customer and business information,
          archive customers, and export eligible reports. Financial records are
          retained for auditability. The deployment operator must publish
          contact details, retention periods, deletion procedures, lawful bases,
          international-transfer details, and applicable rights before accepting
          real customer data.
        </p>
        <h2>Cookies and access</h2>
        <p>
          Authentication cookies maintain your session. Tenant access policies
          restrict records by business membership. No system can promise
          absolute security.
        </p>
        <h2>Before launch</h2>
        <p>
          This pre-release text must be reviewed and completed by the business
          operating the deployment. It is not a jurisdiction-specific legal
          policy.
        </p>
      </main>
      <MarketingFooter />
    </div>
  );
}
