-- Reference schema. Your existing Supabase project already has these
-- tables — you do NOT need to run this again. Keep it only in case you
-- ever need to rebuild the database from scratch.

create extension if not exists "pgcrypto";

create table if not exists kvk_events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists snapshots (
  id uuid primary key default gen_random_uuid(),
  kvk_event_id uuid not null references kvk_events(id) on delete cascade,
  label text not null default 'Snapshot',
  is_baseline boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists governor_stats (
  id bigserial primary key,
  snapshot_id uuid not null references snapshots(id) on delete cascade,
  governor_id text not null,
  governor_name text not null default '',
  power numeric not null default 0,
  t4_kills numeric not null default 0,
  t5_kills numeric not null default 0,
  deaths numeric not null default 0,
  acclaims numeric not null default 0,
  healed_troops numeric not null default 0,
  trades numeric not null default 0
);
create index if not exists governor_stats_snapshot_idx on governor_stats(snapshot_id);
create index if not exists governor_stats_gid_idx on governor_stats(governor_id);

create table if not exists point_rules (
  id serial primary key,
  t4_weight numeric not null default 10,
  t5_weight numeric not null default 12,
  death_weight numeric not null default 60
);
insert into point_rules (t4_weight, t5_weight, death_weight)
  select 10, 12, 60 where not exists (select 1 from point_rules);

create table if not exists power_requirements (
  id serial primary key,
  min_power numeric not null,
  max_power numeric,
  min_deaths numeric not null default 0,
  min_kills numeric not null default 0
);

create table if not exists account_links (
  id serial primary key,
  main_governor_id text not null,
  farm_governor_id text not null unique,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists mge_applications (
  id serial primary key,
  governor_id text not null,
  governor_name text not null,
  vip text not null,
  mge_type text not null,
  commander text,
  message text,
  created_at timestamptz not null default now()
);

create table if not exists fort_weeks (
  id serial primary key,
  label text not null default 'Week',
  created_at timestamptz not null default now()
);

create table if not exists fort_stats (
  id bigserial primary key,
  fort_week_id int not null references fort_weeks(id) on delete cascade,
  governor_id text not null,
  governor_name text not null default '',
  started numeric not null default 0,
  completed numeric not null default 0,
  joined numeric not null default 0,
  total numeric not null default 0
);
create index if not exists fort_stats_week_idx on fort_stats(fort_week_id);

-- Row Level Security
alter table kvk_events enable row level security;
alter table snapshots enable row level security;
alter table governor_stats enable row level security;
alter table point_rules enable row level security;
alter table power_requirements enable row level security;
alter table account_links enable row level security;
alter table fort_weeks enable row level security;
alter table fort_stats enable row level security;
alter table mge_applications enable row level security; -- no public policy on purpose

create policy if not exists "public read kvk_events" on kvk_events for select using (true);
create policy if not exists "public read snapshots" on snapshots for select using (true);
create policy if not exists "public read governor_stats" on governor_stats for select using (true);
create policy if not exists "public read point_rules" on point_rules for select using (true);
create policy if not exists "public read power_requirements" on power_requirements for select using (true);
create policy if not exists "public read account_links" on account_links for select using (true);
create policy if not exists "public read fort_weeks" on fort_weeks for select using (true);
create policy if not exists "public read fort_stats" on fort_stats for select using (true);
-- mge_applications: server (service role) only, never exposed publicly.
