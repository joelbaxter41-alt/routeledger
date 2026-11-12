# Implementation report

## Delivered locally

- Responsive Next.js 16 App Router application, Geist/Geist Mono typography, forest-green/ivory design, desktop sidebar and mobile bottom navigation.
- Public landing/features/pricing/auth/recovery/legal pages and interactive illustrative profit calculator.
- Supabase SSR auth/session refresh/callbacks and business onboarding; credentials required to exercise hosted authentication.
- Tenant-aware database schema with RLS, explicit least-privilege grants, composite foreign keys, lifecycle constraints, immutable financial records, and audit events.
- Customer creation/edit/search/archive and related job profitability; service pricing and saved labor assumptions.
- Job creation/edit/rescheduling/duplication/start/completion/cancellation, aggregate actual minutes, historical labor snapshots, recurring setup and idempotent daily generation.
- Day/week/month calendar and appointment list; advisory form conflict detection.
- Expense entry/edit/filter/job allocation, summary and Pro CSV export.
- Exact minor-unit profit/margin/target-price calculations and persisted-record dashboard, cash/revenue separation, prior-period comparisons, monthly performance, service/customer profitability, customer growth and invoice balance reports.
- Estimate creation and idempotent conversion; multi-line invoice and estimate creation with exact fractional quantities and atomic retry protection, tax, unique numbering, printing/PDF, sent/void status, manual partial payments with transactional overpayment prevention.
- Stripe Checkout, customer portal and signature-verified idempotent webhook code; verified server-side entitlements.
- Resend invoice email code, provider idempotency and database-backed request limits.
- Environment template, guarded development seed script, setup/deployment instructions and financial/retention documentation.

## Executed verification

- Unit and embedded PostgreSQL integration suites: **32 passed**.
- Browser suites: **6 passed**, **2 skipped** (one authenticated workflow per desktop/mobile project, missing live test credentials).
- Browser coverage includes marketing interaction, calculator updates, navigation, mobile overflow, keyboard skip navigation, unconfigured installation states and homepage axe WCAG checks. Initial contrast violations were repaired and the rerun passed.
- TypeScript strict checking, ESLint and Next.js production build passed. The final handoff runs these checks again after final metadata/auth edits.
- Desktop and mobile screenshots inspected/captured locally.

These results do not establish hosted Supabase Auth, email delivery, actual Stripe processing, deployed cron execution, or authenticated browser end-to-end success. Those are pending account configuration. PGlite tests execute PostgreSQL statements and RLS with a local test auth-role harness, not the Supabase hosted Auth service.

## Remote state and remaining work

- GitHub repository: `joelbaxter41-alt/routeledger`. Vercel connection verified as `joelbaxter41@gmail.com`, workspace `joel-baxter`. Source upload and preview deployment are being prepared; live integrations remain unconfigured.
- Configure Supabase project/auth/SMTP, apply migration, set server-only service key, configure Stripe test price/webhooks/portal, verify Resend sender and provision environment values.
- Team features are hidden. No employee assignment, receipts, refunds/credit notes, direct invoice card collection, automated overhead allocation, fiscal-year settings, dark theme or product analytics.
- Legal pages are explicit pre-release drafts. See README for all limits and docs/launch-checks.md for external acceptance work.

The release is prepared for configuration and review; it is **not production-verified**.
