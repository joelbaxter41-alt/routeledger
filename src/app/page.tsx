import Link from "next/link";
import { ArrowUpRight, ArrowRight, Check, TrendingUp } from "lucide-react";
import {
  MarketingNav,
  MarketingFooter,
  FeatureGrid,
  PricingCards,
} from "@/components/marketing";
import { ProfitPreview } from "@/components/profit-preview";
export default function Home() {
  return (
    <div className="marketing">
      <MarketingNav />
      <main id="main">
        <section className="hero">
          <span className="eyebrow">FOR THE BUSINESS YOU’RE BUILDING</span>
          <h1>
            Know exactly what
            <br />
            every job <span style={{ color: "#258657" }}>earns you.</span>
          </h1>
          <p>
            Manage jobs, track expenses, and understand your profitability.
            Built for independent service businesses that take pride in their
            work.
          </p>
          <div className="actions">
            <Link className="button primary" href="/signup">
              Start for free <ArrowUpRight size={16} />
            </Link>
            <Link className="button outline" href="/features">
              Explore features <ArrowRight size={16} />
            </Link>
          </div>
          <div
            style={{
              display: "flex",
              gap: 22,
              justifyContent: "center",
              marginTop: 20,
              fontSize: 11,
              color: "#66716a",
            }}
          >
            <span>Free Starter plan</span>
            <span>No credit card required</span>
            <span>Built for your working day</span>
          </div>
          <div className="hero-preview">
            <div className="section-head">
              <div>
                <div className="eyebrow">ROUTELEDGER / OVERVIEW</div>
                <h2 style={{ margin: "10px 0 0" }}>
                  Good work. Clear numbers.
                </h2>
              </div>
              <span className="badge">Illustrative sample data</span>
            </div>
            <div
              className="stats"
              style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 0 }}
            >
              {[
                ["Job revenue", "$4,800.00", "24 completed jobs"],
                ["Recorded costs", "$1,824.00", "Including labor allowance"],
                [
                  "Est. operating profit",
                  "$2,976.00",
                  "Before taxes & missing costs",
                ],
              ].map(([label, v, note], i) => (
                <div
                  key={label}
                  style={{
                    padding: "22px 15px",
                    background: i === 2 ? "#edf2e9" : "#fafbf8",
                    borderRadius: 7,
                  }}
                >
                  <div className="stat-label">{label}</div>
                  <div
                    className={`stat-value mono ${i === 2 ? "positive" : ""}`}
                    style={{ fontSize: "clamp(16px,2.3vw,28px)" }}
                  >
                    {v}
                  </div>
                  <div className="stat-note">{note}</div>
                </div>
              ))}
            </div>
            <div className="detail-row" style={{ marginTop: 16 }}>
              <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <TrendingUp size={17} color="#258657" />A full schedule is only
                half the story.
              </span>
              <span className="positive" style={{ fontSize: 12 }}>
                Know what you keep.
              </span>
            </div>
          </div>
        </section>
        <section className="marketing-section">
          <div style={{ maxWidth: 590, marginBottom: 32 }}>
            <span className="eyebrow">LESS GUESSWORK. MORE CONFIDENCE.</span>
            <h1 style={{ marginTop: 16 }}>
              You do the work.
              <br />
              Make sure the numbers work, too.
            </h1>
            <p className="muted">
              From the driveway to the desk, RouteLedger keeps the business side
              of your business in order.
            </p>
          </div>
          <FeatureGrid />
        </section>
        <section className="marketing-section">
          <div className="card" style={{ padding: "clamp(22px,4vw,48px)" }}>
            <span className="eyebrow">TRY THE PROFIT-FIRST APPROACH</span>
            <h1 style={{ marginTop: 15 }}>What does a job really earn?</h1>
            <p className="muted">
              A busy day should lead to a better business. Start with one clear
              calculation.
            </p>
            <ProfitPreview />
          </div>
        </section>
        <section className="marketing-section" style={{ textAlign: "center" }}>
          <span className="eyebrow">STRAIGHTFORWARD PLANS</span>
          <h1 style={{ marginTop: 15 }}>
            Start small. Build something strong.
          </h1>
          <p className="muted">
            USD reference pricing. Final price and currency are shown in Stripe
            Checkout.
          </p>
          <PricingCards />
        </section>
        <section className="marketing-section">
          <h1>Good questions. Clear answers.</h1>
          {[
            [
              "Who is RouteLedger for?",
              "Independent lawn-care, landscaping, snow-removal, cleaning, and property-maintenance businesses that want a clearer picture of their profitability.",
            ],
            [
              "Is the profit number my take-home pay?",
              "No. It is estimated operating profit based on recorded charges, labor allowances, and expenses. Unrecorded overhead, taxes, and owner compensation may still need to be deducted.",
            ],
            [
              "Can I start without a credit card?",
              "Yes. Starter includes 10 active customers, scheduling, expense tracking, and basic profitability.",
            ],
            [
              "Does RouteLedger collect invoice payments?",
              "This release records payments you receive by cash, bank transfer, or another method. Stripe is used for RouteLedger subscriptions, not customer invoice collection.",
            ],
          ].map(([q, a]) => (
            <details
              key={q}
              style={{ padding: "20px 0", borderBottom: "1px solid #e4e8e2" }}
            >
              <summary
                style={{ cursor: "pointer", fontWeight: 600, fontSize: 15 }}
              >
                {q}
              </summary>
              <p
                className="muted"
                style={{ maxWidth: 800, margin: "15px 0 0", fontSize: 14 }}
              >
                {a}
              </p>
            </details>
          ))}
        </section>
        <section
          className="marketing-section"
          style={{ textAlign: "center", paddingBottom: 85 }}
        >
          <Check size={30} color="#258657" style={{ margin: "0 auto 18px" }} />
          <h1>Your next chapter starts with clarity.</h1>
          <p className="muted">Run your business. Know your numbers.</p>
          <Link className="button primary" href="/signup">
            Start for free <ArrowUpRight size={16} />
          </Link>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
