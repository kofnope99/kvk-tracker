alter table governor_stats add column if not exists acclaims bigint default 0;
alter table governor_stats add column if not exists healed_troops bigint default 0;
alter table governor_stats add column if not exists trades numeric default 0;
