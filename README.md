# RouteLedger

**Run your business. Know your numbers.**

A Next.js App Router application for independent service businesses, with Supabase authentication/PostgreSQL, tenant RLS, integer-cent job costing, scheduling, customer and service management, expenses, estimates, invoices, manual partial payments, reports, Stripe subscriptions, and Resend invoice email.

This is a runnable first release, **not a verified production launch**. Live Supabase Auth, hosted migrations, Stripe and Resend require external configuration and end-to-end verification. The public site and an explicit unconfigured-installation screen run without secrets; the business workspace never substitutes sample data for database records.

## Prerequisites

- Node.js 22.13+ (verified here using Node 24.22.1), npm, and a Supabase development project.
- A Vercel account for hosting; Stripe test account and verified Resend sender to exercise paid/email flows.
- `npm ci` installs the exact dependency versions in `package-lock.json`. Current installation uses Next.js 16.4.6, React 19.3.1, TypeScript 6.0.3, Supabase SSR, Tailwind 4, Radix/shadcn-compatible primitives, Lucide, Recharts, React Hook Form, and Zod.

## Local installation

```sh
npm ci
cp .env.example .env.local
```

If the home directory is unavailable, use `npm ci --cache ./work/npm-cache`. Fill values through your secure local editor or Vercel environment settings. Never put private keys into `NEXT_PUBLIC_*` variables, commit `.env.local`, or paste credentials into chat.

### Environment variables

| Variable | Purpose | Required for |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Auth and workspace |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public publishable/legacy anon key | Auth and RLS queries |
| `SUPABASE_SERVICE_ROLE_KEY` | Private server-only key | Persistent auth rate limits, billing webhooks, recurring cron, email rate limits |
| `NEXT_PUBLIC_APP_URL` | Canonical application origin | Auth callbacks, checkout and billing portal |
| `STRIPE_SECRET_KEY` | Stripe test/live server key | Checkout, portal, webhook reconciliation |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the specific endpoint | Stripe webhooks |
| `STRIPE_SOLO_PRICE_ID` | Monthly recurring Solo Pro price | Checkout and verified entitlements |
| `RESEND_API_KEY` | Resend server key | Invoice emails |
| `EMAIL_FROM` | Verified sender, e.g. your verified billing address | Invoice emails |
| `CRON_SECRET` | High-entropy private bearer token | Recurring scheduler |

The service-role client exists only in `src/lib/admin.ts` and is never used for customer/job queries. Ordinary business actions use the caller's authenticated Supabase client and RLS. Auth rate limiting deliberately fails closed without server credentials.

## Supabase setup and migration

1. Create a **development** Supabase project. Keep production separate.
2. Apply the SQL files in `supabase/migrations/` in filename order. For a new database, run `001_routeledger.sql` then `002_document_items.sql`; each file is transactional. For an existing installation that already has migration 001, apply only migration 002. Never reapply migration 001 to existing tables.
3. Alternatively, use Supabase CLI: `npx supabase init` if no CLI config exists, `npx supabase login`, `npx supabase link --project-ref YOUR_PROJECT_REF`, then `npx supabase db push`. Confirm the linked target before pushing.
4. Add project URL/public key and server service-role key to `.env.local` or Vercel.
5. Configure Auth → URL Configuration: site URL = your canonical app origin; allow `http://localhost:3000/auth/callback` for development and your deployed `/auth/callback` for production. Avoid broad production wildcard redirects.
6. Enable email/password auth and email confirmations. Configure Supabase SMTP with a verified provider before relying on registration and recovery mail. Resend invoice sending is a separate integration.
7. Configure provider rate limits, password policy, email verification, and bot protection appropriate to launch volume. Application auth attempts also use a hashed IP/email key and database-backed limits.
8. Register, verify email if enabled, then create your business. One business per user is supported in this release; team invitations are intentionally unavailable.

RLS covers every tenant table. Composite tenant foreign keys prevent associating a tenant's job with another tenant's customer/service. Membership creation, invoice creation, estimate conversion, payments, and subscription writes go through protected database functions. No client policy grants subscription or payment mutation. Financial records are preserved; customer removal means archival.

### Development seed data

Create a development user first. Add `ALLOW_DEV_SEED=true`, `SEED_EMAIL`, and `SEED_PASSWORD` only to your local environment, then:

```sh
node --env-file=.env.local scripts/seed.mjs
```

The script requires a localhost app URL and an empty workspace. It creates clearly labeled sample records through the real API and does not grant Pro. Verify the Supabase project is a disposable development project; the localhost check cannot identify a mistakenly configured remote production database. Seeded data must never be presented as production results.

## Development and verification

After linking the intended Vercel project (if using hosted integration variables), pulling its development environment, and applying the migration:

```sh
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
npm run start
```

Open `http://localhost:3000`. The landing page includes an explicitly illustrative calculator; those values are not saved or used in authenticated dashboards.

`npm run test` runs money/workflow unit tests and integration tests against PGlite's real PostgreSQL engine. The database harness creates test auth roles/`auth.uid()` and applies the migration (omitting only the optional `pgcrypto` extension declaration; UUID generation is built in). It tests RLS, tenant spoofing, customer limits, lifecycle snapshots, invoice transactions, payment idempotency/overpayment, estimate conversion, and recurrence. It does **not** emulate hosted Supabase Auth and does not establish that hosted auth/email/network configuration works.

### Browser tests

```sh
npx playwright install chromium
# Start the production server in another terminal after npm run build:
npm run start
npm run test:e2e
```

For restricted home directories, set `PLAYWRIGHT_BROWSERS_PATH` to a writable workspace directory for both install and test commands.

Public browser tests cover calculator interaction, navigation, mobile overflow, keyboard skip navigation, setup-state messaging, and axe WCAG checks. The authenticated workflow test is skipped unless `E2E_EMAIL` and `E2E_PASSWORD` are set. Run it only against an isolated test workspace with a verified Solo Pro subscription, empty appointments on the test date, and a configured Supabase instance. It creates retained test financial records. Set `E2E_BASE_URL` to test a deployed environment. Registration/email-verification delivery and recovery must additionally be exercised using a real test inbox.

## Stripe setup

1. Use Stripe **test mode** first. Create a monthly recurring Solo Pro product/price (reference price USD 19). Set `STRIPE_SOLO_PRICE_ID`; the actual Checkout price is authoritative.
2. Set the test secret key. Do not use a publishable key as a server secret.
3. Install/configure Stripe CLI and run `stripe listen --forward-to localhost:3000/api/stripe/webhook`; save the printed endpoint signing secret privately as `STRIPE_WEBHOOK_SECRET`.
4. Subscribe to `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, and `invoice.payment_failed` in production.
5. Configure Stripe Customer Portal for payment methods, cancellation, and plan changes you intend to support. Only one paid tier is exposed here.
6. Upgrade from Billing. Verify a signed event updates the correct organization's subscription. A checkout success redirect alone **never grants access**.
7. Test cancellation, renewal, payment failure, duplicate event replay, and webhook retry. Verify Pro access expires at `period_end` and invalid states stay locked.

The webhook retrieves current Stripe subscription state rather than trusting client-supplied plans, maps the Stripe customer to a server-created organization mapping, and atomically stores event IDs and subscription state. Stale event creation times cannot overwrite newer stored events. Failed writes return 500 so Stripe retries. Monitor delivery errors and reconcile billing periodically before launch.

Starter permits 10 active customers and basic job/expense/profit workflows. Verified active/trialing Pro unlocks recurring rules, estimates, invoicing, manual payments and CSV exports. Analytics readouts remain available on Starter in this release. Team is hidden. Invoice payments are **manually recorded**; Stripe is used for RouteLedger subscriptions, not customer payment collection.

## Email integration

Configure a Resend account with a verified sending domain, `RESEND_API_KEY`, and `EMAIL_FROM`. Invoice email is sent only when the owner/admin clicks the send action. The server checks tenant ownership and verified Pro status, rate-limits by organization, and uses provider idempotency. It sends invoice details and your configured payment instructions as plain text. It marks the invoice sent only after provider acceptance; it never records a payment. Provider acceptance is not proof of inbox delivery. Confirm sender authentication, delivery and reply address in a test inbox.

PDF uses the browser's Print / Save PDF, with a print layout for invoices and reports. No server-generated PDF attachment is sent. Estimates print the current list in this release.

## Deploy to Vercel

1. Create a private GitHub repository, then push this project to it. This delivered source is not automatically published to GitHub.
2. Import the repository into Vercel; framework preset Next.js, standard `npm run build`, no root-directory override if source is at repository root.
3. Set environment values separately for development/preview/production. Use separate development and production Supabase/Stripe resources and keep service-role and payment keys server-only.
4. Apply the SQL migration to the corresponding Supabase project before enabling application access.
5. Configure canonical app URL, Supabase redirects, verified SMTP, Resend sender, Stripe endpoint signing secret and billing portal.
6. `vercel.json` declares a daily recurring-job cron. Set `CRON_SECRET`; Vercel sends its bearer value. The handler generates 30 days ahead. Confirm cron availability for your Vercel plan.
7. Build and run the authenticated browser workflow against a protected preview; complete Stripe and email test cases.
8. Review legal documents, accessibility, permissions, backups, and operational procedures before accepting production users. Promote only after critical checks pass.

## Financial definitions

See `docs/financial-policy.md` for recognition dates, labor snapshots, allocations, rounding, cash vs revenue, refunds, and retention. Do not treat operating-profit estimates as guaranteed take-home income.

## Known limitations

- External credentials/configuration are required; hosted auth, Stripe Checkout/webhooks/portal, cron delivery and Resend delivery remain unverified until exercised in configured accounts.
- No team invitations, employee assignment/time tracking, worker performance, business switching, or Team plan.
- Invoices and estimates support up to 50 line items and quantities to three decimal places, with atomic creation and retry protection. There is no discount editor, invoice editing, credit-note, or refund workflow. Paid records cannot be voided or deleted; resolve corrections outside this release and retain the original records.
- No receipt uploads, customer-facing payment links, equipment depreciation schedule, custom recurring intervals, map/route optimization, logo upload, fiscal-year configuration, multi-address customers, or automated rate changes.
- Job completion records aggregate actual minutes and the saved labor-rate snapshot. The reserved `time_entries` table is not used in calculations or exposed in UI. Additional labor expenses are distinct from this allowance; do not enter the same cost twice.
- Conflict detection in the job form is advisory and not serialized across simultaneous scheduling requests. Recurring generation and estimate conversion do not enforce calendar conflict checks. Review generated schedules.
- Month recurrence keeps an anchor day and clamps short months; wall-clock local dates/times are stored. Ambiguous/nonexistent DST times are not resolved into dispatch instants by the scheduler; no automatic reminders are sent.
- Reports and workspaces fetch paged records up to 5,000 rows per entity and stop with an explicit error if that limit is exceeded. Table UI pagination and SQL-side aggregation should be added for larger businesses.
- No product analytics collection is enabled. PostHog is deliberately unconfigured; no personal/financial data is sent to analytics.
- Light theme only. WCAG checks cover public pages; authenticated screens still require configured mobile, keyboard, screen-reader, and contrast testing.
- Privacy and terms pages are marked pre-release drafts requiring operator identity, jurisdiction, retention, rights/contact information, and legal review.

## Backups and recovery

Use Supabase automated backups and PITR where available. Set a documented recovery point/time objective, encrypt exported backups, restrict admin access, and periodically restore into an isolated project. Reapply migrations and verify row counts, memberships, invoice totals, payment balances, and webhook mappings. Coordinate recovery with Stripe's authoritative subscription state and replay/reconcile required events. Do not restore a production backup into publicly accessible development. No destructive financial delete workflow is implemented.
