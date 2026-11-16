# Connect Supabase to the hosted RouteLedger application

This is the next required setup step. Creating a Vercel deployment does not create a database or enable application sign-in.

## Create and connect the project

1. Open https://supabase.com/dashboard and sign in with your intended account.
2. The **RouteLedger** project has already been created in your chosen organization, US East. Open https://supabase.com/dashboard/project/ozbcpehahgagtrtcvfux . Do not create a duplicate project.
3. Wait for the project to become ready. Open its Connect/API settings.
4. Open Vercel environment settings: https://vercel.com/joel-baxter/routeledger/settings/environment-variables . Add the following for the environments you intend to use:

| Environment variable | Supabase value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ozbcpehahgagtrtcvfux.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (or legacy anon key) |
| `SUPABASE_SECRET_KEY` | Modern secret key (`sb_secret_...`), stored as a private server-only variable; legacy `SUPABASE_SERVICE_ROLE_KEY` is also supported |
| `NEXT_PUBLIC_APP_URL` | `https://routeledger-joel-baxter.vercel.app` |

The server secret key must never use a `NEXT_PUBLIC_` prefix. Do not put it in GitHub, screenshots, or chat. Use the modern secret key from your Supabase API key settings. Existing legacy service-role keys also work, but you do not need to generate a legacy key. Authentication request rate limits use a private server-side client and fail closed if that key is missing.

## Apply the schema

5. In the Supabase SQL Editor, execute the full contents of `supabase/migrations/001_routeledger.sql` once.
6. Execute `supabase/migrations/002_document_items.sql` once. This adds atomic multi-line invoices/estimates and request retry protection. Both files are transactional. Do not reapply migration 001 after it has succeeded.
7. In Supabase Authentication → URL Configuration, set the site URL to `https://routeledger-joel-baxter.vercel.app` and add `https://routeledger-joel-baxter.vercel.app/auth/callback` as an allowed redirect. Keep email confirmations enabled; configure production SMTP before public onboarding.
8. Redeploy RouteLedger after saving environment values. Public-prefixed variables are incorporated at build time.
9. Register a test account, verify the email, create a business, customer and service, and schedule a job. Start/complete it, record an expense, and check the profit calculation. Sign out and back in to confirm persistence.
10. Keep the hosted application protected while validating the full workflow. Configure Stripe test mode to verify Pro-only invoicing and estimate features, then Resend for invoice emails. See README for those steps.

If the Supabase plugin is connected, the assistant can create a project (subject to any provider cost confirmation), apply these migrations, inspect RLS and schema advisors, and retrieve public project settings. Private server keys should still be configured directly in Vercel settings.
