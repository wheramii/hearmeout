-- Expands the 6-palette accent system into 20 color themes x 3 independent
-- "toxicity" (intensity) levels. theme + toxicity replace the old single
-- accent_palette choice; that column is left in place, unused.
alter table users add column if not exists accent_theme text;
alter table users add column if not exists accent_toxicity text;
