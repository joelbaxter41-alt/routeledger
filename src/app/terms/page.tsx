import { MarketingNav, MarketingFooter } from "@/components/marketing";
export const metadata = { title: "Terms" };
export default function Page() {
  return (
    <div className="marketing">
      <MarketingNav />
      <main id="main" className="legal">
        <span className="eyebrow">
          PRE-RELEASE TERMS · OPERATOR REVIEW REQUIRED
        </span>
        <h1 style={{ marginTop: 20 }}>Terms of service</h1>
        <p>
          RouteLedger provides business management tools for recording
          customers, jobs, expenses, estimates, invoices, and manual payments.
          You are responsible for the accuracy of your records, your account
          security, and your authority to process customer information.
        </p>
        <h2>Financial information</h2>
        <p>
          Profit figures are estimates based on recorded inputs, not accounting,
          tax, legal, or financial advice. You determine appropriate prices, tax
          rates, and recordkeeping requirements. This release does not process
          customer invoice payments or refunds.
        </p>
        <h2>Subscriptions</h2>
        <p>
          The configured price, currency, and billing interval are displayed in
          Stripe Checkout. Owners can use the billing portal to manage
          cancellation and payment details. Paid features require a verified
          active subscription.
        </p>
        <h2>Acceptable use</h2>
        <p>
          Do not attempt unauthorized access, misuse other businesses’
          information, upload unlawful content, or disrupt the service. Maintain
          independent copies of important financial records.
        </p>
        <h2>Before launch</h2>
        <p>
          The deployment operator must identify the contracting business and
          contact information and publish applicable payment, refund,
          cancellation, availability, liability, dispute, and governing-law
          terms before commercial use. This draft needs legal review.
        </p>
      </main>
      <MarketingFooter />
    </div>
  );
}
