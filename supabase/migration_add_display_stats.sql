-- Only needed if you already ran schema.sql before Acclaims/Healed
-- Troops/Trades were added. Safe to run even if columns already exist.
alter table governor_stats add column if not exists acclaims bigint default 0;
alter table governor_stats add column if not exists healed_troops bigint default 0;
alter table governor_stats add column if not exists trades numeric default 0;
