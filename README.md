# KvK Governor Tracker — Setup Guide (no coding required)

This is a complete website: governors search their stats, you upload Excel
sheets, points and pass/fail get calculated automatically, and farm
accounts can be linked to a main account. Total cost: **$0/month**.

You'll use two free websites: **Supabase** (the database) and
**Vercel** (hosts the actual site), plus **GitHub** to move the code
between them. Takes about 20-30 minutes the first time.

## 1. Create your database (Supabase)

1. Go to supabase.com → Sign up (free) → "New project".
2. Pick any name/password (save the password somewhere) and region.
3. Once it's created, click the **SQL Editor** icon on the left → "New query".
4. Open the file `supabase/schema.sql` from this project, copy ALL of it,
   paste it into the SQL editor, and click **Run**. This creates all the
   tables the site needs.
   (If you had already run an older version of this schema, run
   `supabase/migration_add_display_stats.sql` too — it just adds the
   Acclaims/Healed/Trades columns without touching your existing data.)
5. Click **Project Settings** (gear icon) → **API**. You'll need three
   values from this page in step 3 below:
   - `Project URL`
   - `anon public` key
   - `service_role` key (click "reveal" — keep this secret, never share it)

## 2. Put the code on GitHub

1. Go to github.com → sign up if needed → "New repository" → name it
   `kvk-tracker` → Create.
2. On the new repo page, click "uploading an existing file" and drag in
   ALL the files/folders from this project (keep the folder structure).
3. Commit the files.

(If you're comfortable with it, `git push` works too — but drag-and-drop
in the browser is fine and needs zero setup.)

## 3. Deploy the site (Vercel)

1. Go to vercel.com → sign up with your GitHub account.
2. "Add New" → "Project" → pick your `kvk-tracker` repo → Import.
3. Before clicking Deploy, open **Environment Variables** and add these
   four (values from Supabase step 1.5, plus your own admin password):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | your service_role key |
   | `ADMIN_PASSWORD` | any password you choose, for the admin panel |

4. Click **Deploy**. In about a minute you'll get a live URL like
   `kvk-tracker.vercel.app` — that's your website. Share it with your
   alliance.

## 4. Using it

- Go to `yoursite.vercel.app/admin`, log in with the `ADMIN_PASSWORD`
  you set.
- Create a KvK Event (e.g. "KvK Season 5").
- Set your point values (defaults are pre-filled to match your existing
  sheet: Deaths=60, T4 kill=10, T5 kill=12 — change them if your rules
  ever change).
- Add your power-based minimum tiers. Enter them exactly like your
  "Minimum" sheet — min power, max power, minimum deaths, minimum
  kills, one row per bracket (you have 17 of these, 30mil through
  110mil+). The site converts each tier's min deaths/kills into a
  points target automatically the same way your spreadsheet's
  "Min. Contribution" column does (min kills × T5 weight + min deaths
  × Death weight).
- Resource (rss) assistance isn't tracked in this version, per your
  call — it can be added later if you want it counted.
- Upload your first Excel export and **check "baseline"** — this is
  Day 1, everything else is measured against it.
- Every time you re-scan the alliance during the KvK, upload the new
  Excel sheet again (leave "baseline" unchecked) with a label like
  "Day 3". The site always compares the newest upload to the baseline.
- Your Excel file needs columns named (close variants are auto-detected):
  `Governor ID`, `Name`/`Governor Name`, `Power`, `T4 Kills`, `T5 Kills`,
  `Deaths`/`Deads`. Optional columns `Acclaims`, `Healed troops`, and
  `Trades` are also picked up and shown on a governor's page as
  informational stats — they don't count toward points/pass-fail.
- Governors go to the homepage, pick a KvK and a point in time (defaults
  to the current KvK's latest upload), type their Governor ID, and see
  their points and pass/fail status instantly, plus line graphs of
  their points and kills/deaths across every snapshot uploaded so far
  in that KvK. Nothing is ever deleted — every past KvK and every
  snapshot within it stays browsable forever, so governors can look
  back at "how did I do last KvK" or "where was I on Day 3" any time.
- Governors can submit a "link my farm" request from the homepage; you
  approve/reject it from the admin panel, and it auto-combines their
  stats afterward.

- The very top of the homepage shows alliance-wide totals — total kills
  (T4 + T5 broken out) and total deaths, added up across every governor
  and every KvK you've ever uploaded. This updates automatically as you
  upload new snapshots, no extra setup needed.

## Notes & limits (so nothing surprises you)

- The free Supabase tier comfortably handles thousands of governors and
  years of KvK history — you won't hit limits with 300+ people.
- The admin password is simple by design (good enough for an alliance
  tool) — don't reuse a password you use elsewhere, and don't share the
  `service_role` key with anyone.
- Only one KvK event should be marked "active" at a time — that's the
  one governors see stats for. (Editing `is_active` can be done from
  Supabase's Table Editor if you ever run two events.)
- Want changes later (new stat columns, different point formulas,
  design tweaks)? Just paste the code back to me and describe what you
  want changed.
