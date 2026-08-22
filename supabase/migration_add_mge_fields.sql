-- Only needed if you already ran schema.sql before these MGE
-- application fields were added. Safe to run even if they already
-- exist. Note: equipment screenshots are intentionally NOT stored
-- anywhere in the database -- they go straight to Discord only.
alter table mge_applications add column if not exists vip_level integer;
alter table mge_applications add column if not exists mge_type text;
alter table mge_applications add column if not exists commander text;
alter table mge_applications add column if not exists message text;
