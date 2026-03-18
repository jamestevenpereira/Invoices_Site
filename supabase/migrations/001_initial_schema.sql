-- supabase/migrations/001_initial_schema.sql

-- Services catalogue
CREATE TABLE services (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  category      text NOT NULL,
  default_hours numeric NOT NULL DEFAULT 0,
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Quotes and invoices
CREATE TABLE quotes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number       text UNIQUE NOT NULL,
  client_name  text NOT NULL,
  client_email text NOT NULL,
  status       text NOT NULL DEFAULT 'quote' CHECK (status IN ('quote', 'invoice')),
  hourly_rate  numeric NOT NULL,
  items        jsonb NOT NULL DEFAULT '[]',
  notes        text NOT NULL DEFAULT '',
  total_hours  numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  quote_number text,
  sent_at      timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Settings (single row)
CREATE TABLE settings (
  id           integer PRIMARY KEY DEFAULT 1,
  hourly_rate  numeric NOT NULL DEFAULT 15,
  owner_email  text NOT NULL DEFAULT '',
  vat_mode     text NOT NULL DEFAULT 'exempt' CHECK (vat_mode IN ('exempt', 'standard')),
  agency_name  text NOT NULL DEFAULT 'A Minha Agência Web',
  sender_email text NOT NULL DEFAULT 'noreply@agencia.pt'
);

-- updated_at trigger for quotes
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quotes_set_updated_at
BEFORE UPDATE ON quotes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS: enable on all tables
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Anon key: read-only access
CREATE POLICY "anon_read_services" ON services
  FOR SELECT TO anon USING (active = true);

CREATE POLICY "anon_read_quotes" ON quotes
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_read_settings" ON settings
  FOR SELECT TO anon USING (true);

-- Service role: full access (used only in serverless functions)
CREATE POLICY "service_role_all_services" ON services
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_quotes" ON quotes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_settings" ON settings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Seed settings row
INSERT INTO settings (id, hourly_rate, owner_email, vat_mode, agency_name, sender_email)
VALUES (1, 15, '', 'exempt', 'A Minha Agência Web', 'noreply@agencia.pt')
ON CONFLICT (id) DO NOTHING;

-- Seed sample services
INSERT INTO services (name, category, default_hours) VALUES
  ('Página inicial', 'Design', 8),
  ('Página sobre', 'Design', 4),
  ('Página de contacto', 'Design', 3),
  ('Formulário de contacto', 'Desenvolvimento', 3),
  ('SEO básico', 'SEO', 4),
  ('Schema.org LocalBusiness', 'SEO', 2),
  ('Integração Google Maps', 'Desenvolvimento', 2),
  ('Galeria de imagens', 'Desenvolvimento', 5),
  ('Testemunhos', 'Desenvolvimento', 3),
  ('Deploy Vercel + DNS Cloudflare', 'Infraestrutura', 2);
