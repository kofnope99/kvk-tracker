# Kingdom 2194

Full rebuild — same Supabase database as before (no DB changes needed), fixes:

- **Power** is no longer treated as a "gain" stat. It's pinned to the baseline (matchmaking) snapshot for the main account only, so a scan missing the Power column, or a linked farm account, can never zero it out or inflate it.
- **Renaming a governor in-game no longer breaks anything.** Every lookup — search, Top 15 kills, Top 10 deaths, Rankings, the Kingsland Reminder — is now built from one shared function (`lib/aggregate.js`) that keys strictly by `governor_id` and displays the name pinned from the baseline snapshot.
- Upload now warns in the admin panel if a big share of an uploaded file's rows come back all-zero, so a bad scan export gets caught before it goes live.

## Environment variables (Vercel → Settings → Environment Variables)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`
- `DISCORD_WEBHOOK_URL` (MGE applications)
- `TELEPORT_WEBHOOK_URL` (Pass 7 Teleport)
- `ANNOUNCEMENT_WEBHOOK_URL` (Kingsland Reminder)

## Deploying

1. Delete everything in your GitHub repo and drag this entire folder back in (don't drag just the changed files — GitHub's web uploader has silently missed nested files before).
2. Vercel will pick up the push and redeploy automatically. If it doesn't, click **Redeploy** on the latest deployment.
3. No Supabase/database changes are needed — the table structure is unchanged.
