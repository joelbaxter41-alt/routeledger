import {
  MarketingNav,
  MarketingFooter,
  PricingCards,
} from "@/components/marketing";
export const metadata = { title: "Pricing" };
export default function Page() {
  return (
    <div className="marketing">
      <MarketingNav />
      <main id="main" className="marketing-section">
        <div style={{ textAlign: "center" }}>
          <span className="eyebrow">ROOM TO GROW</span>
          <h1 style={{ marginTop: 20 }}>Simple plans for serious work.</h1>
          <p className="muted">
            Start free. Upgrade when your business needs more.
            <br />
            USD reference prices; the configured price and currency appear at
            checkout.
          </p>
        </div>
        <PricingCards />
      </main>
      <MarketingFooter />
    </div>
  );
}
