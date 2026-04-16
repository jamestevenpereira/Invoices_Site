# Payment Status + Client List + Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add payment status tracking to invoices, a client history list, and a dashboard with financial summary stats.

**Architecture:** Payment status is a new column on the existing `quotes` table. Client list derives data from quotes (no new table). Dashboard aggregates quotes client-side via computed signals. All new pages follow the existing 4-file Angular standalone component pattern.

**Tech Stack:** Angular 21 (standalone, signals, OnPush), Vercel serverless functions, Supabase PostgreSQL, Zod, TypeScript strict

---

## File Map

**Modified:**
- `src/app/core/models/index.ts` — add `payment_status` to `Quote` and `UpdateQuotePayload`
- `api/quotes/[id]/index.ts` — accept `payment_status` in PUT schema
- `src/app/features/quotes/detail/quote-detail.component.ts` — add markAsPaid/markAsOverdue
- `src/app/features/quotes/detail/quote-detail.component.html` — payment status buttons
- `src/app/features/quotes/list/quotes-list.component.html` — payment status badge
- `src/app/app.routes.ts` — add dashboard and clients routes
- `src/app/layout/admin-layout.component.html` — add nav links

**Created:**
- `src/app/features/dashboard/dashboard.component.ts/html/scss/spec.ts`
- `src/app/features/clients/clients-list/clients-list.component.ts/html/scss/spec.ts`

---

## Task 1: Database Migration

Run this SQL in **Supabase Dashboard → SQL Editor**:

- [ ] **Step 1: Run migration**

```sql
ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending'
  CHECK (payment_status IN ('pending', 'paid', 'overdue'));
```

- [ ] **Step 2: Verify**

```sql
SELECT id, number, status, payment_status FROM quotes LIMIT 5;
```

Expected: all existing rows show `payment_status = 'pending'`.

- [ ] **Step 3: Commit note**

```bash
git commit --allow-empty -m "chore: add payment_status column to quotes table (run in Supabase SQL editor)"
```

---

## Task 2: Update Model & API Schema

**Files:**
- Modify: `src/app/core/models/index.ts`
- Modify: `api/quotes/[id]/index.ts`

- [ ] **Step 1: Update Quote interface** in `src/app/core/models/index.ts`

Replace:
```typescript
status: 'quote' | 'invoice';
```
With:
```typescript
status: 'quote' | 'invoice';
payment_status: 'pending' | 'paid' | 'overdue';
```

And in `UpdateQuotePayload`, add after `discount_label?`:
```typescript
payment_status?: 'pending' | 'paid' | 'overdue';
```

- [ ] **Step 2: Update API schema** in `api/quotes/[id]/index.ts`

In the `schema` zod object, add after `discount_label`:
```typescript
payment_status: z.enum(['pending', 'paid', 'overdue']).optional(),
```

- [ ] **Step 3: Build check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/core/models/index.ts api/quotes/[id]/index.ts
git commit -m "feat: add payment_status to Quote model and API schema"
```

---

## Task 3: Payment Status Buttons in Quote Detail

**Files:**
- Modify: `src/app/features/quotes/detail/quote-detail.component.ts`
- Modify: `src/app/features/quotes/detail/quote-detail.component.html`

- [ ] **Step 1: Add method to component** — open `quote-detail.component.ts` and add after the `convert()` method:

```typescript
async setPaymentStatus(status: 'paid' | 'overdue' | 'pending') {
  const q = this.quote();
  if (!q) return;
  try {
    const updated = await this.quoteService.updateQuote(q.id, { payment_status: status });
    this.quote.set(updated);
  } catch (e: unknown) {
    this.error.set(e instanceof Error ? e.message : 'Erro ao actualizar estado');
  }
}
```

- [ ] **Step 2: Add payment status buttons to HTML**

In `quote-detail.component.html`, find the actions section (where the send/convert buttons are) and add this block (only visible when status is 'invoice'):

```html
@if (quote()?.status === 'invoice') {
  <div class="payment-actions">
    <span class="payment-label">Estado de pagamento:</span>
    <button
      class="btn-status"
      [class.active]="quote()?.payment_status === 'paid'"
      (click)="setPaymentStatus('paid')">
      Pago
    </button>
    <button
      class="btn-status"
      [class.active]="quote()?.payment_status === 'pending'"
      (click)="setPaymentStatus('pending')">
      Pendente
    </button>
    <button
      class="btn-status btn-status--overdue"
      [class.active]="quote()?.payment_status === 'overdue'"
      (click)="setPaymentStatus('overdue')">
      Em Atraso
    </button>
  </div>
}
```

- [ ] **Step 3: Build check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/app/features/quotes/detail/
git commit -m "feat: add payment status buttons to invoice detail"
```

---

## Task 4: Payment Status Badge in Quote List

**Files:**
- Modify: `src/app/features/quotes/list/quotes-list.component.html`

- [ ] **Step 1: Add badge to list rows**

In `quotes-list.component.html`, find where the quote `status` is displayed and add alongside it:

```html
@if (q.status === 'invoice') {
  <span class="badge"
    [class.badge--paid]="q.payment_status === 'paid'"
    [class.badge--overdue]="q.payment_status === 'overdue'"
    [class.badge--pending]="q.payment_status === 'pending'">
    {{ q.payment_status === 'paid' ? 'Pago' : q.payment_status === 'overdue' ? 'Em Atraso' : 'Pendente' }}
  </span>
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/features/quotes/list/quotes-list.component.html
git commit -m "feat: show payment status badge in quotes list"
```

---

## Task 5: Dashboard Component

**Files:**
- Create: `src/app/features/dashboard/dashboard.component.ts`
- Create: `src/app/features/dashboard/dashboard.component.html`
- Create: `src/app/features/dashboard/dashboard.component.scss`
- Create: `src/app/features/dashboard/dashboard.component.spec.ts`

- [ ] **Step 1: Create component TS** — `src/app/features/dashboard/dashboard.component.ts`

```typescript
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { QuoteService } from '../../core/services/quote.service';
import type { Quote } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private quoteService = inject(QuoteService);

  quotes = signal<Quote[]>([]);
  error = signal('');

  invoices = computed(() => this.quotes().filter(q => q.status === 'invoice'));
  totalInvoiced = computed(() => this.invoices().reduce((s, q) => s + q.total_amount, 0));
  totalPaid = computed(() => this.invoices().filter(q => q.payment_status === 'paid').reduce((s, q) => s + q.total_amount, 0));
  totalPending = computed(() => this.invoices().filter(q => q.payment_status === 'pending').reduce((s, q) => s + q.total_amount, 0));
  totalOverdue = computed(() => this.invoices().filter(q => q.payment_status === 'overdue').reduce((s, q) => s + q.total_amount, 0));
  recentInvoices = computed(() => this.invoices().slice(0, 5));

  async ngOnInit() {
    try {
      this.quotes.set(await this.quoteService.getQuotes());
    } catch {
      this.error.set('Erro ao carregar dados');
    }
  }
}
```

- [ ] **Step 2: Create HTML** — `src/app/features/dashboard/dashboard.component.html`

```html
<div class="dashboard">
  <h1 class="page-title">Dashboard</h1>

  @if (error()) {
    <p class="error">{{ error() }}</p>
  }

  <div class="stats-grid">
    <div class="stat-card">
      <span class="stat-label">Total Faturado</span>
      <span class="stat-value">{{ totalInvoiced() | currency:'EUR':'symbol':'1.2-2':'pt' }}</span>
    </div>
    <div class="stat-card stat-card--paid">
      <span class="stat-label">Pago</span>
      <span class="stat-value">{{ totalPaid() | currency:'EUR':'symbol':'1.2-2':'pt' }}</span>
    </div>
    <div class="stat-card stat-card--pending">
      <span class="stat-label">Pendente</span>
      <span class="stat-value">{{ totalPending() | currency:'EUR':'symbol':'1.2-2':'pt' }}</span>
    </div>
    <div class="stat-card stat-card--overdue">
      <span class="stat-label">Em Atraso</span>
      <span class="stat-value">{{ totalOverdue() | currency:'EUR':'symbol':'1.2-2':'pt' }}</span>
    </div>
  </div>

  <section class="recent">
    <h2>Faturas Recentes</h2>
    @if (recentInvoices().length === 0) {
      <p class="empty">Sem faturas ainda.</p>
    } @else {
      <table class="table">
        <thead>
          <tr>
            <th>Número</th>
            <th>Cliente</th>
            <th>Total</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          @for (inv of recentInvoices(); track inv.id) {
            <tr>
              <td><a [routerLink]="['/admin/quotes', inv.id]">{{ inv.number }}</a></td>
              <td>{{ inv.client_name }}</td>
              <td>{{ inv.total_amount | currency:'EUR':'symbol':'1.2-2':'pt' }}</td>
              <td>
                <span class="badge"
                  [class.badge--paid]="inv.payment_status === 'paid'"
                  [class.badge--overdue]="inv.payment_status === 'overdue'"
                  [class.badge--pending]="inv.payment_status === 'pending'">
                  {{ inv.payment_status === 'paid' ? 'Pago' : inv.payment_status === 'overdue' ? 'Em Atraso' : 'Pendente' }}
                </span>
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  </section>
</div>
```

- [ ] **Step 3: Create SCSS** — `src/app/features/dashboard/dashboard.component.scss`

```scss
.dashboard { padding: 2rem; }
.page-title { font-size: 1.5rem; font-weight: 600; margin-bottom: 1.5rem; }
.error { color: #dc2626; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  &--paid  { border-left: 4px solid #16a34a; }
  &--pending { border-left: 4px solid #ca8a04; }
  &--overdue { border-left: 4px solid #dc2626; }
}

.stat-label { font-size: 0.8rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
.stat-value { font-size: 1.5rem; font-weight: 700; }

.recent h2 { font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; }
.empty { color: #6b7280; }

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;

  th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
  th { font-weight: 600; color: #374151; }
  a { color: #2563eb; text-decoration: none; &:hover { text-decoration: underline; } }
}

.badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background: #f3f4f6;
  color: #374151;

  &--paid    { background: #dcfce7; color: #16a34a; }
  &--pending { background: #fef9c3; color: #ca8a04; }
  &--overdue { background: #fee2e2; color: #dc2626; }
}
```

- [ ] **Step 4: Create spec** — `src/app/features/dashboard/dashboard.component.spec.ts`

```typescript
import { TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { QuoteService } from '../../core/services/quote.service';

describe('DashboardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [{ provide: QuoteService, useValue: { getQuotes: () => Promise.resolve([]) } }],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
```

- [ ] **Step 5: Build check**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/app/features/dashboard/
git commit -m "feat: add dashboard with financial summary stats"
```

---

## Task 6: Client List Component

**Files:**
- Create: `src/app/features/clients/clients-list/clients-list.component.ts`
- Create: `src/app/features/clients/clients-list/clients-list.component.html`
- Create: `src/app/features/clients/clients-list/clients-list.component.scss`
- Create: `src/app/features/clients/clients-list/clients-list.component.spec.ts`

- [ ] **Step 1: Create TS** — `src/app/features/clients/clients-list/clients-list.component.ts`

```typescript
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { QuoteService } from '../../../core/services/quote.service';
import type { Quote } from '../../../core/models';

export interface ClientSummary {
  name: string;
  email: string;
  nif: string;
  quoteCount: number;
  invoiceCount: number;
  totalInvoiced: number;
  lastActivity: string;
  quoteIds: string[];
}

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './clients-list.component.html',
  styleUrl: './clients-list.component.scss',
})
export class ClientsListComponent implements OnInit {
  private quoteService = inject(QuoteService);

  quotes = signal<Quote[]>([]);
  error = signal('');

  clients = computed<ClientSummary[]>(() => {
    const map = new Map<string, ClientSummary>();
    for (const q of this.quotes()) {
      const key = q.client_email;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          name: q.client_name,
          email: q.client_email,
          nif: q.client_nif,
          quoteCount: q.status === 'quote' ? 1 : 0,
          invoiceCount: q.status === 'invoice' ? 1 : 0,
          totalInvoiced: q.status === 'invoice' ? q.total_amount : 0,
          lastActivity: q.created_at,
          quoteIds: [q.id],
        });
      } else {
        if (q.status === 'quote') existing.quoteCount++;
        if (q.status === 'invoice') { existing.invoiceCount++; existing.totalInvoiced += q.total_amount; }
        if (q.created_at > existing.lastActivity) existing.lastActivity = q.created_at;
        existing.quoteIds.push(q.id);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));
  });

  async ngOnInit() {
    try {
      this.quotes.set(await this.quoteService.getQuotes());
    } catch {
      this.error.set('Erro ao carregar clientes');
    }
  }
}
```

- [ ] **Step 2: Create HTML** — `src/app/features/clients/clients-list/clients-list.component.html`

```html
<div class="clients">
  <h1 class="page-title">Clientes</h1>

  @if (error()) {
    <p class="error">{{ error() }}</p>
  }

  @if (clients().length === 0) {
    <p class="empty">Sem clientes ainda. Cria o primeiro orçamento.</p>
  } @else {
    <table class="table">
      <thead>
        <tr>
          <th>Cliente</th>
          <th>NIF</th>
          <th>Orçamentos</th>
          <th>Faturas</th>
          <th>Total Faturado</th>
        </tr>
      </thead>
      <tbody>
        @for (client of clients(); track client.email) {
          <tr>
            <td>
              <div class="client-name">{{ client.name }}</div>
              <div class="client-email">{{ client.email }}</div>
            </td>
            <td>{{ client.nif || '—' }}</td>
            <td>{{ client.quoteCount }}</td>
            <td>{{ client.invoiceCount }}</td>
            <td>{{ client.totalInvoiced | currency:'EUR':'symbol':'1.2-2':'pt' }}</td>
          </tr>
        }
      </tbody>
    </table>
  }
</div>
```

- [ ] **Step 3: Create SCSS** — `src/app/features/clients/clients-list/clients-list.component.scss`

```scss
.clients { padding: 2rem; }
.page-title { font-size: 1.5rem; font-weight: 600; margin-bottom: 1.5rem; }
.error { color: #dc2626; }
.empty { color: #6b7280; }

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;

  th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
  th { font-weight: 600; color: #374151; }
}

.client-name { font-weight: 500; }
.client-email { font-size: 0.8rem; color: #6b7280; }
```

- [ ] **Step 4: Create spec** — `src/app/features/clients/clients-list/clients-list.component.spec.ts`

```typescript
import { TestBed } from '@angular/core/testing';
import { ClientsListComponent } from './clients-list.component';
import { QuoteService } from '../../../core/services/quote.service';

describe('ClientsListComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientsListComponent],
      providers: [{ provide: QuoteService, useValue: { getQuotes: () => Promise.resolve([]) } }],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ClientsListComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
```

- [ ] **Step 5: Build check**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/app/features/clients/
git commit -m "feat: add clients list derived from quotes"
```

---

## Task 7: Routes & Navigation

**Files:**
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/layout/admin-layout.component.html`

- [ ] **Step 1: Add routes** in `src/app/app.routes.ts`

Add these two routes inside the `children` array, before the existing routes:

```typescript
{ path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
{ path: 'clients', loadComponent: () => import('./features/clients/clients-list/clients-list.component').then(m => m.ClientsListComponent) },
```

Change the default redirect:
```typescript
{ path: '', redirectTo: 'dashboard', pathMatch: 'full' },
```

- [ ] **Step 2: Add nav links** in `src/app/layout/admin-layout.component.html`

Add before the existing `Orçamentos` link:

```html
<a class="nav-link" routerLink="/admin/dashboard" routerLinkActive="active">
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  Dashboard
</a>

<a class="nav-link" routerLink="/admin/clients" routerLinkActive="active">
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  Clientes
</a>
```

- [ ] **Step 3: Build check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/app/app.routes.ts src/app/layout/admin-layout.component.html
git commit -m "feat: add dashboard and clients routes and nav links"
```

---

## Task 8: Final Verification

- [ ] **Step 1: Full build**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 2: Run dev server and manually verify**

```bash
npm start
```

Check:
- `/admin/dashboard` — shows 4 stat cards and recent invoices table
- `/admin/clients` — shows client list grouped by email
- Invoice detail — shows payment status buttons (Pago / Pendente / Em Atraso)
- Quote detail — payment buttons NOT shown (only invoices)
- Quotes list — invoices show payment status badge

- [ ] **Step 3: Push**

```bash
git push
```
