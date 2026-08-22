-- Only needed if you already ran schema.sql before MGE applications
-- were added. Safe to run even if the table already exists.
create table if not exists mge_applications (
  id bigint generated always as identity primary key,
  governor_id text not null,
  governor_name text,
  submitted_at timestamptz default now()
);
alter table mge_applications enable row level security;
