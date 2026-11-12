import { context } from "@/lib/context";
import { configured } from "@/lib/supabase";
import { Navigation } from "@/components/navigation";
import { logout } from "@/app/actions";
import { Search, LogOut, ChevronRight } from "lucide-react";
import Link from "next/link";
export const dynamic = "force-dynamic";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!configured())
    return (
      <main className="legal" id="main">
        <h1>Your workspace is almost ready.</h1>
        <p>
          Connect Supabase and apply the migration to enable secure accounts and
          persistent business data. See the README for setup steps.
        </p>
        <Link className="button primary" href="/">
          Back to RouteLedger
        </Link>
      </main>
    );
  const { organization, user } = await context();
  return (
    <div className="shell">
      <Navigation business={organization.name} />
      <div className="main-column">
        <header className="topbar">
          <div className="workspace-breadcrumb">
            <span>{organization.name}</span>
            <ChevronRight size={13} />
            <span>Workspace</span>
          </div>
          <form action="/app/search" className="search" role="search">
            <Search size={16} />
            <input
              name="q"
              aria-label="Search customers and jobs"
              placeholder="Search customers, jobs…"
              minLength={2}
              required
            />
          </form>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="account-avatar" title={user.email}>
              {user.email?.slice(0, 2).toUpperCase()}
            </span>
            <form action={logout}>
              <button className="button ghost" aria-label="Sign out">
                <LogOut size={17} />
              </button>
            </form>
          </div>
        </header>
        <main id="main" className="content">
          {children}
        </main>
      </div>
    </div>
  );
}
