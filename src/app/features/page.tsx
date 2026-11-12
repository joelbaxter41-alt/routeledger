import {
  MarketingNav,
  MarketingFooter,
  FeatureGrid,
} from "@/components/marketing";
import { ProfitPreview } from "@/components/profit-preview";
export const metadata = { title: "Features" };
export default function Page() {
  return (
    <div className="marketing">
      <MarketingNav />
      <main id="main" className="marketing-section">
        <div className="hero" style={{ paddingTop: 35 }}>
          <span className="eyebrow">THE WHOLE JOB. THE WHOLE PICTURE.</span>
          <h1>
            Your business,
            <br />
            working together.
          </h1>
          <p>
            Customers, schedules, costs, estimates, and invoices. Connected by
            the number that matters: profit.
          </p>
        </div>
        <FeatureGrid />
        <div className="card" style={{ marginTop: 40 }}>
          <h2>A little clarity goes a long way.</h2>
          <ProfitPreview />
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
