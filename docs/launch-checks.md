# External verification still required

This checklist records actual remaining acceptance work, not completed tests.

- Apply the migration to a disposable hosted Supabase project; inspect grants/RLS using anon, authenticated user A, authenticated user B, and server roles.
- Register, receive confirmation, verify, sign in/out, recover/reset password, and return with the session/data intact.
- Create business → customer → service → job → start/complete → expense → verify profit.
- Upgrade through Stripe test Checkout; verify signed webhook mapping. Replay duplicate/old events, simulate failed renewal and cancellation, and check paid endpoints remain locked without valid state.
- Create invoice → print/PDF → send through verified Resend sender → check real inbox → record partial/final payment → export CSV.
- Test concurrent payment attempts and invoice numbering against hosted PostgreSQL.
- Run authenticated Playwright workflow on desktop/mobile, check browser console and database values, then manually review keyboard focus and screen-reader names.
- Verify daily cron authentication, recurrence uniqueness and timezone-local schedule dates, including short-month and DST cases.
- Publish operator-specific legal contact, privacy, retention, refunds and terms; configure backups/PITR and test restoration.
- Verify email and payment integrations in the intended production scope before promotion.
