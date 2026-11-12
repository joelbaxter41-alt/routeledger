import Link from "next/link";
import { BrandLogo } from "./brand";
import {
  Route,
  ArrowUpRight,
  TrendingUp,
  CalendarDays,
  Users,
  Receipt,
  Check,
  ArrowRight,
} from "lucide-react";
export function MarketingNav() {
  return (
    <nav aria-label="Public navigation">
      <Link className="logo" href="/" aria-label="RouteLedger home">
        <BrandLogo />
      </Link>
      <div className="links">
        <Link href="/features">Features</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/#how-it-works">How it works</Link>
        <Link href="/login">Sign in</Link>
        <Link className="button primary" href="/signup">
          Start for free <ArrowUpRight size={15} />
        </Link>
      </div>
    </nav>
  );
}
export function MarketingFooter() {
  return (
    <footer>
      <Link
        className="logo"
        style={{ fontSize: 18, color: "#163f32" }}
        href="/"
      >
        <BrandLogo compact />
      </Link>
      <span>Run your business. Know your numbers.</span>
      <div className="actions">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/login">Sign in</Link>
      </div>
    </footer>
  );
}
export function FeatureGrid() {
  const features = [
    {
      icon: TrendingUp,
      title: "Know what’s left. Not just what came in.",
      text: "See the charge, labor allowance, and expenses behind each job. Price your next one with more confidence.",
    },
    {
      icon: CalendarDays,
      title: "Keep good work on the calendar.",
      text: "Plan your day, reschedule in a few clicks, and turn repeat customers into recurring work.",
    },
    {
      icon: Users,
      title: "Remember the details that matter.",
      text: "Keep customer details, job history, estimates, invoices, and payments connected.",
    },
    {
      icon: Receipt,
      title: "Every expense has a place.",
      text: "Track the fuel, supplies, and overhead that can quietly eat into a busy month.",
    },
    {
      icon: Route,
      title: "From scheduled to settled.",
      text: "Take a job from the first appointment through completion, invoicing, and manual payment recording.",
    },
    {
      icon: Check,
      title: "A clearer view of your business.",
      text: "Separate completed job revenue from cash received. Understand the assumptions behind your estimated profit.",
    },
  ];
  return (
    <div className="feature-grid">
      {features.map(({ icon: Icon, title, text }) => (
        <article className="card" key={title}>
          <Icon size={25} />
          <h2>{title}</h2>
          <p>{text}</p>
        </article>
      ))}
    </div>
  );
}
export function PricingCards() {
  return (
    <div className="details" style={{ maxWidth: 850, margin: "30px auto" }}>
      {[
        {
          name: "Starter",
          price: "0",
          subtitle: "A strong foundation for your first jobs.",
          items: [
            "10 active customers",
            "Job scheduling & completion",
            "Expense tracking",
            "Basic job profitability",
          ],
          cta: "Start for free",
        },
        {
          name: "Solo Pro",
          price: "19",
          subtitle: "More clarity for a growing business.",
          items: [
            "Unlimited customers and jobs",
            "Recurring schedules",
            "Estimates, invoices & manual payments",
            "Reports and CSV exports",
          ],
          cta: "Get started",
        },
      ].map((p, i) => (
        <section
          className="card"
          style={i ? { borderColor: "#8eaf8d" } : undefined}
          key={p.name}
        >
          <div className="eyebrow">{p.name}</div>
          <div className="price" style={{ margin: "20px 0" }}>
            ${p.price}
            <small> / month</small>
          </div>
          <p className="muted" style={{ fontSize: 14 }}>
            {p.subtitle}
          </p>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              lineHeight: 2.8,
              fontSize: 13,
            }}
          >
            {p.items.map((item) => (
              <li
                style={{ display: "flex", gap: 10, alignItems: "center" }}
                key={item}
              >
                <Check size={15} color="#258657" />
                {item}
              </li>
            ))}
          </ul>
          <Link
            className={`button ${i ? "primary" : "outline"}`}
            style={{ width: "100%" }}
            href="/signup"
          >
            {p.cta}
            <ArrowRight size={15} />
          </Link>
        </section>
      ))}
    </div>
  );
}
