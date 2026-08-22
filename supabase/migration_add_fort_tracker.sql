-- Only needed if you already ran schema.sql before the Fort Tracker
-- was added. Safe to run even if these tables already exist.
create table if not exists fort_weeks (
  id bigint generated always as identity primary key,
  label text not null,
  uploaded_at timestamptz default now()
);
create table if not exists fort_stats (
  id bigint generated always as identity primary key,
  week_id bigint references fort_weeks(id) on delete cascade,
  governor_id text not null,
  governor_name text,
  started bigint default 0,
  completed bigint default 0,
  joined bigint default 0,
  total bigint default 0
);
create index if not exists fort_stats_week_gov_idx on fort_stats (week_id, governor_id);

alter table fort_weeks enable row level security;
alter table fort_stats enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'fort_weeks' and policyname = 'public read fort_weeks') then
    create policy "public read fort_weeks" on fort_weeks for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'fort_stats' and policyname = 'public read fort_stats') then
    create policy "public read fort_stats" on fort_stats for select using (true);
  end if;
end $$;
