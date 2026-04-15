-- supabase/migrations/003_add_discount_to_quotes.sql
ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_label  text    NOT NULL DEFAULT '';
