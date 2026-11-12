"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  CalendarDays,
  Users,
  Receipt,
  ChartNoAxesCombined,
  FileText,
  Files,
  Layers,
  ChartPie,
  Settings,
  CreditCard,
  Route,
  ArrowUpRight,
} from "lucide-react";
const links = [
  ["/app", "Overview", LayoutDashboard],
  ["/app/jobs", "Jobs", BriefcaseBusiness],
  ["/app/calendar", "Calendar", CalendarDays],
  ["/app/customers", "Customers", Users],
  ["/app/expenses", "Expenses", Receipt],
  ["/app/analytics", "Profit analytics", ChartNoAxesCombined],
  ["/app/estimates", "Estimates", Files],
  ["/app/invoices", "Invoices", FileText],
  ["/app/services", "Services", Layers],
  ["/app/reports", "Reports", ChartPie],
  ["/app/settings", "Settings", Settings],
  ["/app/billing", "Billing", CreditCard],
] as const;
export function Navigation({ business }: { business: string }) {
  const path = usePathname();
  const active = (href: string) =>
    href === "/app" ? path === href : path.startsWith(href);
  return (
    <>
      <aside className="sidebar">
        <Link className="logo" href="/app">
          <span className="logo-mark">
            <Route size={20} />
          </span>
          RouteLedger
        </Link>
        <div className="business">
          {business}
          <small>Your business workspace</small>
        </div>
        <div
          className="eyebrow"
          style={{ color: "#94ad9d", padding: "0 12px", marginBottom: 12 }}
        >
          WORKSPACE
        </div>
        <nav className="nav" aria-label="Main navigation">
          {links.slice(0, 10).map(([href, title, Icon]) => (
            <Link
              key={href}
              href={href}
              aria-current={active(href) ? "page" : undefined}
              className={active(href) ? "active" : ""}
            >
              <Icon size={17} />
              {title}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <nav className="nav" aria-label="Account">
            {links.slice(10).map(([href, title, Icon]) => (
              <Link
                key={href}
                href={href}
                className={active(href) ? "active" : ""}
              >
                <Icon size={17} />
                {title}
              </Link>
            ))}
          </nav>
          <div className="plan">
            More clarity. Better business.
            <Link
              href="/app/billing"
              className="text-link"
              style={{ color: "#b8d4b4", marginTop: 10 }}
            >
              Explore Solo Pro <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </aside>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {[links[0], links[1], links[2], links[3], links[10]].map(
          ([href, title, Icon]) => (
            <Link
              key={href}
              href={href}
              className={active(href) ? "active" : ""}
            >
              <Icon size={21} />
              {title}
            </Link>
          ),
        )}
      </nav>
    </>
  );
}
