-- Only needed if you already ran migration_add_mge_fields.sql back
-- when vip_level was a number-only column. Converts it to text so it
-- can hold "SVIP" as well as 1-19. Safe to run even if it's already
-- text -- it just won't need to change anything.
alter table mge_applications alter column vip_level type text using vip_level::text;
