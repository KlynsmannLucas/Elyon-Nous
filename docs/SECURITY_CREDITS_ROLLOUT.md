# Access, user isolation and atomic credits

Apply these migrations in Supabase **before** deploying this branch:

1. `supabase/migrations/20261110_atomic_credits.sql`
2. `supabase/migrations/20261110_user_data_access.sql`

The application deliberately returns 503 for paid AI operations when the balance store/RPC is unavailable. Do not deploy the application before its SQL functions exist. Existing usage is preserved; expired balances reset on the first debit of the new UTC calendar month. Charge and refund run under row locks. Refunds use an immutable charge ID, are idempotent, and do not alter a later month's balance.

Clerk `privateMetadata.role = "admin"` is the administrative authority. Set this only through the trusted Clerk dashboard/server. A public subscription called `admin` does not grant privileges. Paid subscriptions remain `individual`, `profissional`, `avancada`; the trial is 7 days across AI endpoints. The 360 pipeline bundle costs 29 credits per request (including partial pipelines); if no agent succeeds it is refunded. Existing explicitly priced operations keep their configured prices; `first_ad` and `competitor_xray` keep their previous fallback price of 2 credits.

Set `CRON_SECRET` in the deployment environment. Unconfigured or unauthorized cron calls are rejected. The service role key remains server-side. The private-table migration revokes direct anon/authenticated table access; server routes filter by the Clerk user ID. Public report/portal pages continue to use their server endpoints. Storage bucket policies are not changed by these migrations.

UserScopeBoundary waits for Clerk identity before mounting the application. Unknown local ownership is cleared, matching ownership is retained, and switching users remounts through a full reload. Logout clears local state. Client/connection restores ignore late responses after unmount. No OAuth access token is written in the persisted store.

Validation:

```sh
npm ci --ignore-scripts
(cd mcp && npm ci --ignore-scripts)
npm run test:security
npx tsc --noEmit --incremental false
```

Database regression test runs the actual migrations in PostgreSQL via PGlite. Install it separately to keep production dependencies unchanged:

```sh
npm install --prefix /tmp/elyon-validation --no-audit --no-fund @electric-sql/pglite
PGLITE_MODULE=/tmp/elyon-validation/node_modules/@electric-sql/pglite npm run test:credits-db
```

The SQL test checks simultaneous debit requests, insufficient balance, separate users, monthly rollover, duplicate/wrong-owner/old-period refunds, and anon versus service-role privileges. Production Clerk, Supabase, Stripe and advertising API calls are not exercised by these local tests.
