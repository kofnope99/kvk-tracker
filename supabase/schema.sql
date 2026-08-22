-- Run this whole file once in Supabase: Project -> SQL Editor -> New query -> paste -> Run

create table kvk_events (
  id bigint generated always as identity primary key,
  name text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table snapshots (
  id bigint generated always as identity primary key,
  kvk_event_id bigint references kvk_events(id) on delete cascade,
  label text not null,
  is_baseline boolean default false,
  uploaded_at timestamptz default now()
);

create table governor_stats (
  id bigint generated always as identity primary key,
  snapshot_id bigint references snapshots(id) on delete cascade,
  governor_id text not null,
  governor_name text,
  power bigint default 0,
  t4_kills bigint default 0,
  t5_kills bigint default 0,
  deaths bigint default 0,
  acclaims bigint default 0,
  healed_troops bigint default 0,
  trades numeric default 0
);
create index on governor_stats (snapshot_id, governor_id);

create table point_rules (
  id bigint generated always as identity primary key,
  kvk_event_id bigint references kvk_events(id) on delete cascade,
  stat_name text not null, -- 'deaths' | 't4_kills' | 't5_kills'
  points_per_unit numeric not null default 0,
  unique(kvk_event_id, stat_name)
);

create table power_requirements (
  id bigint generated always as identity primary key,
  kvk_event_id bigint references kvk_events(id) on delete cascade,
  min_power bigint not null,
  max_power bigint,
  min_deaths bigint not null default 0,
  min_kills bigint not null default 0
);

create table account_links (
  id bigint generated always as identity primary key,
  main_governor_id text not null,
  farm_governor_id text not null unique,
  status text default 'pending', -- pending | approved | rejected
  requested_at timestamptz default now()
);

-- Row Level Security: public can READ everything (it's just game stats),
-- but only the server (using the service role key) can WRITE, except
-- governors are allowed to submit a link request themselves.
alter table kvk_events enable row level security;
alter table snapshots enable row level security;
alter table governor_stats enable row level security;
alter table point_rules enable row level security;
alter table power_requirements enable row level security;
alter table account_links enable row level security;

create policy "public read kvk_events" on kvk_events for select using (true);
create policy "public read snapshots" on snapshots for select using (true);
create policy "public read governor_stats" on governor_stats for select using (true);
create policy "public read point_rules" on point_rules for select using (true);
create policy "public read power_requirements" on power_requirements for select using (true);
create policy "public read account_links" on account_links for select using (true);

create policy "public can request link" on account_links for insert with check (status = 'pending');

-- MGE (event) applications -- deliberately locked down: no public
-- select policy, since this is temporary data only the admin should
-- see. The server always writes/reads this using the service role key.
create table mge_applications (
  id bigint generated always as identity primary key,
  governor_id text not null,
  governor_name text,
  submitted_at timestamptz default now()
);
alter table mge_applications enable row level security;
-- (no policies added on purpose -- public gets no direct access at all;
-- only server-side code using the service role key can read/write it)

-- Fort tracker -- a separate, resettable weekly tracking system (not
-- tied to KvK events). Each upload is one week's forts-destroyed
-- totals; the whole thing gets wiped via the Reset button each new
-- off-season.
create table fort_weeks (
  id bigint generated always as identity primary key,
  label text not null,
  uploaded_at timestamptz default now()
);

create table fort_stats (
  id bigint generated always as identity primary key,
  week_id bigint references fort_weeks(id) on delete cascade,
  governor_id text not null,
  governor_name text,
  started bigint default 0,
  completed bigint default 0,
  joined bigint default 0,
  total bigint default 0
);
create index on fort_stats (week_id, governor_id);

alter table fort_weeks enable row level security;
alter table fort_stats enable row level security;
create policy "public read fort_weeks" on fort_weeks for select using (true);
create policy "public read fort_stats" on fort_stats for select using (true);
