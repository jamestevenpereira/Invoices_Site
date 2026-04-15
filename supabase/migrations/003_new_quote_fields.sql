-- supabase/migrations/003_new_quote_fields.sql
-- Adds: client NIF, payment terms, validity date to quotes
-- Adds: business NIF and IBAN to settings

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS client_nif     text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS payment_terms  text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS valid_until    date;

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS nif  text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS iban text NOT NULL DEFAULT '';
