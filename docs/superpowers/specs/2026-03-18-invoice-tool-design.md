# Invoice Tool — Design Spec

**Date:** 2026-03-18
**Project:** Internal quote & invoice builder for a Portuguese web development agency
**Stack:** Angular v21 · Supabase · Vercel Serverless · Resend · jsPDF

---

## Overview

A private, password-protected single-page application embedded in the agency's own website. The tool allows the owner to build client quotes from a predefined service catalogue, calculate costs at a configurable hourly rate (default €15/hr), generate PDFs, and send quotes/invoices by email. Quotes can be converted to invoices once work is delivered.

**Only one user:** the agency owner. No client-facing interface.

---

## Goals

1. Quickly estimate project costs based on what a client requests
2. Generate a professional PDF quote/invoice
3. Send it to the client (and keep a copy) via email
4. Maintain a history of all quotes and invoices
5. Manage a reusable service catalogue

---

## Routes

```
/login                  Password gate
/admin                  Redirects to /admin/quotes
/admin/quotes           List of all quotes & invoices
/admin/quotes/new       Quote builder
/admin/quotes/:id       View / edit / send a quote or invoice
/admin/services         Service catalogue management
/admin/settings         Hourly rate and preferences
```

All `/admin/*` routes are protected by an Angular `AuthGuard`.

---

## Authentication

**Login flow:**
1. User enters password on `/login`
2. Angular sends `POST /api/auth/login` with `{ password }`
3. Serverless function compares against `ADMIN_PASSWORD` env var
4. On match, returns a signed JWT (signed with `JWT_SECRET` env var, 8-hour expiry)
5. JWT stored in `localStorage` as `admin_token`

**AuthGuard:**
- Reads `admin_token` from `localStorage`
- Decodes and validates the JWT signature and expiry client-side using `jose`
- If invalid or expired, redirects to `/login`

**API authentication:**
- Every serverless API call includes `Authorization: Bearer <token>` header
- Each function verifies the JWT before acting — unauthenticated requests return 401

---

## Data Models (Supabase)

### `services`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | e.g. "Homepage", "Contact Form" |
| `category` | text | e.g. "Design", "Development", "SEO" |
| `default_hours` | numeric | Pre-filled when added to a quote |
| `active` | boolean | false = archived, hidden from quote builder |
| `created_at` | timestamptz | |

### `quotes`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `number` | text | Generated server-side (see Number Generation below) |
| `client_name` | text | |
| `client_email` | text | |
| `status` | text | `'quote'` or `'invoice'` |
| `hourly_rate` | numeric | Snapshotted at creation (default €15) |
| `items` | jsonb | `[{service_id, name, hours, subtotal}]` |
| `notes` | text | Optional notes for the client |
| `total_hours` | numeric | Computed sum of item hours |
| `total_amount` | numeric | `total_hours × hourly_rate` |
| `quote_number` | text | null on new quotes; stores original ORC-YYYY-NNN when converted to invoice |
| `sent_at` | timestamptz | null if not yet sent |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | Maintained by Supabase trigger (see below) |

### `settings`

Single-row table for persisted preferences. Always `id = 1`. The row is seeded in the migration — the settings service always upserts so the row is never missing.

| Column | Type | Notes |
|---|---|---|
| `id` | integer PK | Always 1 |
| `hourly_rate` | numeric | Default €15 |
| `owner_email` | text | Copy of all sent quotes goes here |
| `vat_mode` | text | `'exempt'` or `'standard'` — default `'exempt'` |

**Design decisions:**
- `items` stored as JSONB — quotes are point-in-time snapshots. Editing a service later doesn't change existing quotes.
- `hourly_rate` snapshotted per quote for the same reason.
- No separate `clients` table — `client_name` + `client_email` stored directly on the quote (minimal history chosen).

---

## Supabase RLS & Data Access

**All Supabase writes go through Vercel serverless functions** — the Angular client never writes directly to Supabase. This means the anon key exposed in the Angular bundle has read-only access at most, and all mutations are authenticated via JWT on the server.

**RLS policies:**
- `services` — anon key: SELECT only (active = true). Serverless (service role key): full access.
- `quotes` — anon key: SELECT only. Serverless (service role key): full access.
- `settings` — anon key: SELECT only. Serverless (service role key): full access.

The Angular client uses the **anon key** for reads (displaying quotes, services, settings). All creates, updates, and deletes go through serverless API endpoints that use the **service role key** (never exposed to the client).

---

## Serverless API Endpoints

```
POST /api/auth/login          Validate password, return signed JWT
POST /api/quotes              Create a new quote (saves to Supabase)
PUT  /api/quotes/:id          Update a quote (edit or convert to invoice)
POST /api/quotes/:id/send     Send quote/invoice by email (Resend)
POST /api/services            Create a service
PUT  /api/services/:id        Update a service
DELETE /api/services/:id      Archive a service (sets active = false)
PUT  /api/settings            Update settings (upsert)
GET  /api/health              UptimeRobot monitoring
```

Every endpoint except `/api/auth/login` and `/api/health` validates the JWT from the `Authorization` header before acting. Invalid/expired token → 401.

---

## Quote Number Generation

Quote numbers are generated server-side in the `/api/quotes` (create) endpoint to avoid race conditions and duplicates.

**Format:**
- Quotes: `ORC-YYYY-NNN` (e.g. `ORC-2026-001`)
- Invoices: `FAT-YYYY-NNN` (e.g. `FAT-2026-001`)

**Sequence:** Each series (`ORC`, `FAT`) has its own independent counter. The server queries `MAX(number)` for the relevant prefix and year, increments, and zero-pads to 3 digits.

**On conversion (quote → invoice):** The quote receives a new number from the `FAT-YYYY-NNN` series. The original `ORC-` number is preserved in a `quote_number` field for reference. This ensures invoice numbers are sequential and unbroken within the FAT series — required for Portuguese fiscal compliance.

---

## VAT / IVA

The tool targets a Portuguese business. Portuguese law requires invoices to either include IVA or explicitly state the exemption basis.

**Implementation:** The PDF includes a VAT line. The owner can choose per-quote in `/admin/settings`:
- **Isento** — "Isento nos termos do artigo 53.º do CIVA" (for small businesses below the €15,000 annual turnover threshold as of 2025). This text is printed on the invoice; no VAT amount is added.
- **23% IVA** — VAT is calculated and added as a line item. `total_amount` in the database remains the pre-tax amount; the PDF shows the breakdown.

The settings default is **Isento** (most likely for a solo freelancer starting out). The owner can switch to 23% in settings at any time.

The `settings` table gains one column:
```
vat_mode   text   'exempt' | 'standard'   default 'exempt'
```

---

## Quote Builder (`/admin/quotes/new`)

**Layout — two-panel view:**
- **Left panel:** Service picker — catalogue grouped by category. Click a service to add it to the quote.
- **Right panel:** Live quote preview — list of added items, each with an editable hours field. At the bottom: hourly rate slider (€10–€100, step €1) and live totals (total hours + total amount).

**Above the panels:**
- Client name + client email
- Quote number (shown as "Auto-generated" until saved)
- Optional notes field

**Action buttons (top right):**
- **Save draft** — calls `POST /api/quotes`
- **Download PDF** — generates client-side via jsPDF (programmatic)
- **Send by email** — confirmation modal → calls `POST /api/quotes/:id/send`

**Hourly rate behaviour:**
- Slider defaults to `settings.hourly_rate`
- Changing the slider updates all subtotals and total in real-time (Angular Signals)
- The chosen rate is snapshotted into `quotes.hourly_rate` on save

---

## Quote → Invoice Conversion

On `/admin/quotes/:id`, a **"Convert to Invoice"** button:
1. Calls `PUT /api/quotes/:id` with `{ status: 'invoice' }`
2. Server generates a new `FAT-YYYY-NNN` number
3. Stores the original quote number in `quotes.quote_number`
4. Returns the updated quote

The converted invoice is re-sendable as a fatura.

---

## Quote/Invoice List (`/admin/quotes`)

A table showing all quotes and invoices:
- Quote/invoice number
- Client name
- Status badge (`QUOTE` / `INVOICE`)
- Total amount (pre-tax)
- Date created
- Sent date (or "Not sent")
- Actions: view, download PDF

---

## Service Catalogue (`/admin/services`)

A table of all services grouped by category. Each row: name, category, default hours, active toggle, edit and delete buttons.

**Add/Edit:** inline form (no page navigation) — name, category (dropdown of existing + option to type new), default hours.

**Archive instead of delete** — preserves historical quote integrity. Archived services are hidden from the quote builder.

---

## Settings (`/admin/settings`)

- **Default hourly rate** — slider (€10–€100, step €1). Saved via `PUT /api/settings`.
- **VAT mode** — toggle: Isento / 23% IVA.
- **Owner email** — copy of every sent quote/invoice delivered here.

---

## PDF Generation

Generated **entirely client-side** using **jsPDF programmatic API** (drawing text and lines directly — no html2canvas). This avoids html2canvas's known reliability issues (font rendering, CORS on images, cross-browser inconsistencies).

The `QuotePdfService` composes the PDF programmatically from the quote data object. It does not render the DOM.

**PDF structure:**
1. Header — agency name (top left), quote/invoice number + date (top right)
2. Client name and email
3. Itemised table: service name | hours | unit price (€/hr) | subtotal
4. Subtotal, VAT line (amount or "Isento..." text), **Total**
5. Optional notes
6. Footer — owner contact details + legal exemption text (if applicable)

The `quote-preview` component in the UI is a display-only component for on-screen rendering. The PDF is generated independently from the data model, not from the DOM.

---

## Email (`POST /api/quotes/:id/send`)

Receives `quoteId` in the URL, validates JWT, then:

1. Fetches the quote from Supabase (using service role key)
2. Sends email to client via Resend (HTML template)
3. Sends copy to owner email
4. **Only after both sends succeed**, writes `sent_at = now()` to Supabase
5. Returns `{ success: true }` to the client

**On failure:** Returns an error to the Angular client. The UI surfaces the error ("Falha ao enviar — tente novamente"). `sent_at` is not written if either email fails. No automatic retry — the user can manually retry from the UI.

---

## Database Migrations

**`updated_at` trigger** (applied to `quotes`):
```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quotes_set_updated_at
BEFORE UPDATE ON quotes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

**Settings seed** (run in migration):
```sql
INSERT INTO settings (id, hourly_rate, owner_email, vat_mode)
VALUES (1, 15, '', 'exempt')
ON CONFLICT (id) DO NOTHING;
```

---

## Angular Architecture

```
src/app/
  core/
    services/
      auth.service.ts                # JWT login, localStorage, logout
      quote.service.ts               # API calls for quote CRUD
      service-catalogue.service.ts   # API calls for services CRUD
      settings.service.ts            # API calls for settings
      quote-pdf.service.ts           # jsPDF programmatic PDF generation
    guards/
      auth.guard.ts                  # JWT validation, redirects to /login
  features/
    login/
    quotes/
      list/                          # /admin/quotes
      new/                           # /admin/quotes/new (quote builder)
      detail/                        # /admin/quotes/:id
    services/                        # /admin/services
    settings/                        # /admin/settings
  shared/
    components/
      quote-preview/                 # display-only on-screen quote render
```

**Patterns:** Standalone components, Signals for all reactive state, `OnPush` change detection, `inject()` over constructor injection, `strict: true`.

---

## Language

- **Code:** English (variable names, function names, comments, commit messages)
- **UI / Frontend:** Portuguese — PT-PT (all labels, buttons, placeholders, error messages, email templates, PDF content)

Examples:
- "Save draft" → "Guardar rascunho"
- "Convert to Invoice" → "Converter em Fatura"
- "Download PDF" → "Descarregar PDF"
- "Send by email" → "Enviar por email"
- "Total hours" → "Total de horas"
- "Hourly rate" → "Custo por hora"

---

## Out of Scope (for now)

- Multi-user / team access
- Client portal (clients viewing their own quotes)
- Payment integration (Stripe / MBway)
- Recurring invoices
- Stripe payment links on invoices
- Full fiscal compliance (certified invoicing software — AT communication)

> **Note on fiscal compliance:** For a small freelancer under the Article 53 CIVA exemption threshold (€15,000 annual turnover as of 2025), this tool is sufficient for operational use. If the business grows and becomes VAT-registered, a certified invoicing solution (e.g. Moloni, InvoiceXpress) will be required by Portuguese law — these systems handle AT communication obligations. This tool is intentionally a budget-estimation and communication aid, not a certified accounting system.
