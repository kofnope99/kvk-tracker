# KvK Governor Tracker — Setup Guide

Complete website: governors search their stats, you upload Excel
sheets, points and pass/fail calculate automatically, farm accounts
link to mains, plus a Fort Tracker, MGE applications, Pass 7 Teleport
submissions, and a kingdom-wide contribution rankings page. Runs on
Supabase (database) and Vercel (hosting), both free at your scale.

## 1. Create your database (Supabase)

1. Go to supabase.com → Sign up → "New project".
2. Once created, open the **SQL Editor** → "New query".
3. Open `supabase/schema.sql` from this project, copy ALL of it, paste
   it in, and click **Run**. This creates every table the site needs.
4. Go to **Project Settings** (gear icon) → **API**. You'll need the
   **Project URL**, **anon public** key, and **service_role** key
   (click reveal) for the next step. (On newer projects these may be
   labeled "publishable" and "secret" instead — use those the same way.)

## 2. Put the code on GitHub

1. Create a new repository (e.g. `kvk-tracker`) on github.com.
2. Click "uploading an existing file", drag in every file and folder
   from this project (keep the folder structure), and commit.

## 3. Deploy the site (Vercel)

1. Go to vercel.com → sign in with GitHub → Add New → Project → import
   your repo.
2. Before deploying, add these environment variables:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon/publishable key |
   | `SUPABASE_SERVICE_ROLE_KEY` | your service_role/secret key |
   | `ADMIN_PASSWORD` | any password you choose |
   | `DISCORD_WEBHOOK_URL` | your admin channel's webhook (see below) |
   | `TELEPORT_WEBHOOK_URL` | webhook for the Pass 7 Teleport channel |
   | `ANNOUNCEMENT_WEBHOOK_URL` | webhook for the Kingsland Reminder's channel |

3. Click **Deploy**. You'll get a live URL like `kvk-tracker.vercel.app`.

## 4. Using it

- `/admin` — log in with `ADMIN_PASSWORD`. Create a KvK event, set
  point values (pre-filled to 60 death / 10 T4 / 12 T5), add power-tier
  requirements (min deaths + min kills per bracket), then upload your
  baseline Excel and re-upload as the KvK progresses.
- Excel columns picked up: `Governor ID`, `Name`/`Governor Name`,
  `Power`, `T4 Kills`, `T5 Kills`, `Deaths`/`Deads`, and optionally
  `Acclaims`, `Healed troops`, `Trades` (shown as info only).
- The homepage search box takes a Governor ID or a name, with live
  suggestions as you type. Multiple name matches show a picker.
- Governors can request a farm-account link from the homepage; once
  approved in `/admin`, the farm's kills/deaths count at **20% weight**
  toward the main account (power always comes from the main account
  only, never combined).
- If a KvK has only one snapshot uploaded, its numbers are shown as
  totals (compared against zero) rather than a delta against itself —
  useful for backfilling a KvK you only have final numbers for.
- **Contribution Rankings** (`/rankings`) — top 300 governors kingdom-
  wide, ranked by contribution points for whichever KvK/snapshot is
  selected, with a Pass/Below status per governor.
- **Fort Tracker** (`/fort`) — a separate, resettable weekly system.
  Upload one week's sheet at a time from `/admin` (columns:
  `governor_id`, `name`, `started`, `completed`, `joined`, `Total` —
  Total defaults to completed + joined if not present). Shows kingdom
  total forts destroyed, that week's top 15, an off-season top 10, and
  its own governor search. The admin panel's **Reset off-season**
  button wipes every week — only use it when a new 8-week off-season
  starts.
- **MGE Application** (`/mge`) — players submit Governor ID, name, VIP
  level (1–19 or SVIP), MGE type, desired commander, an optional
  equipment screenshot, and a message. The screenshot is relayed
  directly to Discord and **never stored**. Applications (without the
  image) are saved temporarily and auto-delete after 14 days; the
  admin panel also shows each applicant's T4/T5 kills across their
  last 3 KvKs.
- **Pass 7 Teleport** (`/teleport`) — players submit their governor
  name and a mandatory crystal-spend screenshot, plus an optional role
  (Swarmer/Field/Counter Rally/Garrison/Rally). Picking Garrison or
  Rally shows a reminder to send tech/equipment screenshots to Todo or
  DeathKing in-game. **Nothing on this page is ever stored** — it's
  relayed straight to its own Discord channel (`TELEPORT_WEBHOOK_URL`)
  and discarded.
- **Kingsland Reminder** button (in `/admin`) — sends a single
  `@everyone` Discord message (to its own channel, via
  `ANNOUNCEMENT_WEBHOOK_URL`) listing every governor above 55M power
  who hasn't met the current KvK's minimum requirement yet, reminding
  them to do so before the end of Kingsland. Nothing is stored; it
  only sends the message. Long lists are split across multiple
  Discord messages automatically (Discord's 2000-character limit).

## Setting up the Discord webhooks

You need up to three, depending on which features you use:

1. In Discord, open the target channel → gear icon → **Integrations**
   → **Webhooks** → **New Webhook** → name it → **Copy Webhook URL**.
2. Do this for: your admin channel (`DISCORD_WEBHOOK_URL`, used by MGE
   applications), wherever Pass 7 Teleport submissions should land
   (`TELEPORT_WEBHOOK_URL`), and your announcement channel
   (`ANNOUNCEMENT_WEBHOOK_URL`, used by the Kingsland Reminder button)
   — these can all be the same channel or all different ones.
3. Add each URL as an environment variable in Vercel.

If a webhook variable isn't set, that specific feature's Discord
message just won't send — nothing else breaks.

## Look & feel

Themed as "Kingdom 2194" — stone/iron backgrounds, aged gold and
blood-red accents, parchment-toned text, Cinzel for headers, EB
Garamond for body text, monospace for stat figures. Pass/fail shows
as a rotated wax-seal badge. Tell me if you want the palette, fonts,
or layout changed again.

## Notes & limits (so nothing surprises you)

- The free Supabase tier comfortably handles thousands of governors
  and years of KvK history.
- The admin password is simple by design — don't reuse one you use
  elsewhere, and never share the `service_role` key.
- Only one KvK event should be marked "active" at a time (via "Set as
  active" in the admin panel) — that's the one governors see by
  default. You can still view and manage any other KvK regardless.
- MGE application data (governor ID/name/VIP/type/commander/message)
  is kept for 14 days then auto-deleted on the next admin panel load.
  Screenshots for MGE and Pass 7 Teleport are never stored at all.
- Want more changes later? Just describe what you want and I'll
  update the code.
