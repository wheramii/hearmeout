-- HearMeOut — migration 003: interface language + region preference.
-- Run in Supabase SQL Editor after migration_002_real_data.sql.

alter table users add column if not exists language text not null default 'ru'
  check (language in ('ru','en','fr','es','de'));
alter table users add column if not exists region text; -- ISO 3166-1 alpha-2, null = global
