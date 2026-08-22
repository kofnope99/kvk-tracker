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
   `supabase/migration_add_display_stats.sql` and
   `supabase/migration_add_mge_applications.sql` too — both just add
   new pieces without touching your existing data.)
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

- Two more comparison views: a **"Compare KvKs — alliance totals"**
  section (pick any two KvKs, see T4/T5 kills and deaths as grouped
  bars), and, after searching a Governor ID, a **"Compare against
  another KvK"** picker that bar-charts that governor's T4/T5 kills,
  deaths, and points between their current KvK and any other one —
  farm-account weighting applies here too.
- The **Alliance totals** and **Top governors** sections both follow
  whichever KvK and snapshot you pick in the selector above them —
  pick a different KvK to see its totals and leaderboard instead.
  There's no need to mark anything "active" just to view historical
  data; "active" only controls which KvK loads by default when someone
  first opens the site.

- The homepage also shows a **Top governors** leaderboard — top 15 by
  kills, top 10 by deaths — for whichever KvK and snapshot is picked
  in the selector. Farm accounts don't appear as their own leaderboard
  entries; their (weighted) stats are folded into their main account.
- When a farm account is linked and approved, only **20% of its kills
  and deaths** count toward the main account's total (power and the
  informational stats are unaffected). This applies everywhere a
  governor's combined stats show up — search results, the charts, and
  the leaderboard.
- Uploaded a snapshot by mistake? In the admin panel's Upload section,
  every snapshot for the currently selected KvK is listed with a
  Delete button — deleting one removes that upload and all its
  governor stats, and doesn't affect any other snapshot.

## Look & feel

The site is themed around "Kingdom 2194" — a medieval war-kingdom
look: stone and iron backgrounds, aged gold and blood-red accents,
parchment-toned text, a carved-stone display typeface (Cinzel) paired
with a manuscript body serif (EB Garamond), and monospace figures for
stat numbers so they still line up like a scribe's tally. Pass/fail
shows as a rotated wax-seal badge. If you ever want the palette or
fonts changed again, just tell me the direction and I'll rework the
tokens in `tailwind.config.js`, `app/layout.js`, and `app/globals.css`
— the rest of the site pulls from those automatically.

- The homepage search box now accepts a **Governor ID or a name**. If
  more than one governor matches a typed name, a picker shows up so
  the right one can be chosen.
- There's a public **MGE application page** at `yoursite.vercel.app/mge`
  — players enter their Governor ID and name, which (1) posts to your
  Discord admin channel along with their current Power/T4/T5/Deaths for
  the active KvK, and (2) shows up in the admin panel under "MGE
  applications," where their stats are shown and each entry can be
  deleted manually. Applications older than 14 days are deleted
  automatically the next time the admin panel loads that section —
  this data is intentionally temporary, not archived.

## Setting up the Discord webhook (for MGE applications)

1. In Discord, go to your admin channel → click the gear icon (Edit
   Channel) → **Integrations** → **Webhooks** → **New Webhook**.
2. Name it (e.g. "MGE Applications"), make sure it's pointed at the
   right channel, then click **Copy Webhook URL**.
3. In Vercel, go to your project → Settings → Environment Variables →
   add `DISCORD_WEBHOOK_URL` with that pasted URL, then redeploy (or
   just wait for your next commit to trigger one).

If this variable isn't set, the application page still works and
still saves to the admin panel — it just won't post to Discord.

- The homepage now opens with a hero banner (with a "Last dispatch"
  timestamp showing when stats were last uploaded) and quick nav tabs
  to the MGE application page and the admin panel — no more needing
  to type `/mge` in directly.

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
