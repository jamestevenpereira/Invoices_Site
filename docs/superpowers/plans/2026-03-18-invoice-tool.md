# Invoice Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a private, password-protected Angular v21 app for creating, sending, and tracking client quotes and invoices for a Portuguese web dev agency.

**Architecture:** Angular v21 SPA with protected `/admin/*` routes reads data from Supabase using the anon key; all writes go through Vercel serverless functions that validate a JWT and use the Supabase service role key. PDFs are generated client-side with jsPDF. Emails are sent via Resend from a single serverless endpoint.

**Tech Stack:** Angular v21 · Supabase · Vercel Serverless Functions (TypeScript) · Resend · jsPDF · jose (JWT) · Zod · Jest + Angular Testing Library

---

## File Map

```
d:\Invoices_Site\
├── src/app/
│   ├── app.config.ts                         # Providers, HttpClient, router
│   ├── app.component.ts                      # Root shell with <router-outlet>
│   ├── app.routes.ts                         # Route definitions, lazy loading
│   ├── core/
│   │   ├── models/index.ts                   # Quote, Service, Settings, QuoteItem types
│   │   ├── utils/api-client.ts               # fetch wrapper that injects Authorization header
│   │   ├── services/
│   │   │   ├── auth.service.ts               # login(), logout(), isAuthenticated(), getToken()
│   │   │   ├── quote.service.ts              # createQuote(), updateQuote(), getQuotes(), getQuote()
│   │   │   ├── service-catalogue.service.ts  # getServices(), createService(), updateService(), archiveService()
│   │   │   ├── settings.service.ts           # getSettings(), updateSettings()
│   │   │   └── quote-pdf.service.ts          # generatePdf(quote) → downloads PDF via jsPDF
│   │   └── guards/auth.guard.ts              # checks JWT validity, redirects to /login
│   ├── layout/admin-layout.component.ts      # Nav sidebar + <router-outlet>
│   ├── features/
│   │   ├── login/login.component.ts
│   │   ├── quotes/
│   │   │   ├── list/quotes-list.component.ts
│   │   │   ├── new/quote-builder.component.ts
│   │   │   └── detail/quote-detail.component.ts
│   │   ├── services/services-catalogue.component.ts
│   │   └── settings/settings.component.ts
│   └── shared/components/
│       └── quote-preview/quote-preview.component.ts  # display-only render of a quote
├── api/
│   ├── _lib/
│   │   ├── jwt.ts              # verifyJwt(req) helper — used by every protected endpoint
│   │   └── supabase.ts         # createAdminClient() — service role key, server-side only
│   ├── auth/login.ts           # POST /api/auth/login
│   ├── quotes/
│   │   ├── index.ts            # POST /api/quotes (create)
│   │   └── [id]/
│   │       ├── index.ts        # PUT /api/quotes/:id (update / convert)
│   │       └── send.ts         # POST /api/quotes/:id/send
│   ├── services/
│   │   ├── index.ts            # POST /api/services
│   │   └── [id].ts             # PUT /api/services/:id, DELETE /api/services/:id
│   ├── settings/index.ts       # PUT /api/settings
│   └── health.ts               # GET /api/health
├── supabase/migrations/001_initial_schema.sql
├── src/environments/
│   ├── environment.ts
│   └── environment.prod.ts
├── .env.example
├── vercel.json
└── jest.config.js
```

---

## Task 1: Project Bootstrap

**Files:**
- Create: `package.json`, `angular.json`, `tsconfig.json`, `jest.config.js`, `vercel.json`, `.env.example`, `.gitignore`

- [ ] **Step 1: Scaffold the Angular project**

```bash
cd d:/Invoices_Site
ng new . --routing --style=scss --strict --skip-git
```

When prompted: choose SCSS, enable routing.

- [ ] **Step 2: Install all dependencies**

```bash
npm install @supabase/supabase-js jspdf jose zod resend
npm install -D jest @types/jest jest-preset-angular @testing-library/angular
```

- [ ] **Step 3: Configure Jest**

Replace `src/test.ts` content (if it exists) and create `jest.config.js`:

```js
// jest.config.js
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],  // NOTE: setupFilesAfterEnv, not setupFilesAfterFramework
  testMatch: ['**/src/**/*.spec.ts', '**/api/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

```ts
// setup-jest.ts
import 'jest-preset-angular/setup-jest';
```

Update `tsconfig.spec.json` to use Jest types:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["jest"]
  },
  "include": ["src/**/*.spec.ts", "api/**/*.test.ts", "setup-jest.ts"]
}
```

Update `package.json` scripts:
```json
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage"
```

- [ ] **Step 4: Create `vercel.json`**

```json
{
  "framework": "angular",
  "buildCommand": "npm run build",
  "outputDirectory": "dist/invoices-site/browser",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- [ ] **Step 5: Create `.env.example`**

```bash
# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Auth
ADMIN_PASSWORD=changeme
JWT_SECRET=a-long-random-secret-at-least-32-chars

# Resend
RESEND_API_KEY=re_...
```

- [ ] **Step 6: Create `.gitignore` entry**

Ensure `.env`, `.env.local`, and `.superpowers/` are in `.gitignore`:
```
.env
.env.local
.superpowers/
```

- [ ] **Step 7: Create folder structure**

```bash
mkdir -p src/app/core/models
mkdir -p src/app/core/services
mkdir -p src/app/core/guards
mkdir -p src/app/core/utils
mkdir -p src/app/layout
mkdir -p src/app/features/login
mkdir -p src/app/features/quotes/list
mkdir -p src/app/features/quotes/new
mkdir -p src/app/features/quotes/detail
mkdir -p src/app/features/services
mkdir -p src/app/features/settings
mkdir -p src/app/shared/components/quote-preview
mkdir -p api/_lib
mkdir -p api/auth
mkdir -p "api/quotes/[id]"
mkdir -p "api/services"
mkdir -p api/settings
mkdir -p supabase/migrations
mkdir -p src/environments
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: bootstrap Angular project with Jest and Vercel config"
```

---

## Task 2: Supabase Schema & Migrations

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Write the migration**

```sql
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
```

- [ ] **Step 2: Run migration in Supabase**

Go to Supabase Dashboard → SQL Editor → paste and run the migration.

Alternatively with CLI:
```bash
supabase db push
```

- [ ] **Step 3: Verify in Supabase**

Check Dashboard → Table Editor — all three tables should exist with their seed data.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/001_initial_schema.sql
git commit -m "feat: add initial Supabase schema with RLS policies and seed data"
```

---

## Task 3: Shared Types & API Utilities

**Files:**
- Create: `src/app/core/models/index.ts`
- Create: `src/app/core/utils/api-client.ts`
- Create: `api/_lib/jwt.ts`
- Create: `api/_lib/supabase.ts`
- Create: `src/environments/environment.ts`
- Create: `src/environments/environment.prod.ts`

- [ ] **Step 1: Write shared TypeScript types**

```ts
// src/app/core/models/index.ts

export interface QuoteItem {
  service_id: string;
  name: string;
  hours: number;
  subtotal: number;
}

export interface Quote {
  id: string;
  number: string;
  client_name: string;
  client_email: string;
  status: 'quote' | 'invoice';
  hourly_rate: number;
  items: QuoteItem[];
  notes: string;
  total_hours: number;
  total_amount: number;
  quote_number: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  default_hours: number;
  active: boolean;
  created_at: string;
}

export interface Settings {
  id: number;
  hourly_rate: number;
  owner_email: string;
  vat_mode: 'exempt' | 'standard';
  agency_name: string;
  sender_email: string;
}

export interface CreateQuotePayload {
  client_name: string;
  client_email: string;
  hourly_rate: number;
  items: QuoteItem[];
  notes: string;
}

export interface UpdateQuotePayload {
  client_name?: string;
  client_email?: string;
  hourly_rate?: number;
  items?: QuoteItem[];
  notes?: string;
  status?: 'quote' | 'invoice';
}
```

- [ ] **Step 2: Write the API client utility**

```ts
// src/app/core/utils/api-client.ts

const TOKEN_KEY = 'admin_token';

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? 'Erro desconhecido');
  }
  // 204 No Content (e.g. DELETE) — no body to parse
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
```

- [ ] **Step 3: Write the JWT helper (server-side)**

```ts
// api/_lib/jwt.ts
import { jwtVerify, SignJWT } from 'jose';
import type { IncomingMessage } from 'http';

const secret = new TextEncoder().encode(process.env['JWT_SECRET']!);

export async function signToken(): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret);
}

export async function verifyJwt(req: IncomingMessage): Promise<boolean> {
  const auth = req.headers['authorization'];
  if (!auth?.startsWith('Bearer ')) return false;
  const token = auth.slice(7);
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Write the Supabase admin client (server-side)**

```ts
// api/_lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  return createClient(
    process.env['SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!,
    { auth: { persistSession: false } }
  );
}
```

- [ ] **Step 5: Write environments**

```ts
// src/environments/environment.ts
export const environment = {
  production: false,
  supabaseUrl: 'http://localhost:54321',         // local Supabase
  supabaseAnonKey: 'your-local-anon-key',
};
```

```ts
// src/environments/environment.prod.ts
// Values are substituted at build time by the generate-env script (see below).
// Do NOT use process.env here — this file is compiled into the browser bundle.
export const environment = {
  production: true,
  supabaseUrl: '%%SUPABASE_URL%%',
  supabaseAnonKey: '%%SUPABASE_ANON_KEY%%',
};
```

Create a build-time substitution script that Vercel runs before `ng build`:

```js
// scripts/inject-env.js
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../src/environments/environment.prod.ts');
let content = fs.readFileSync(file, 'utf8');
content = content
  .replace('%%SUPABASE_URL%%', process.env.SUPABASE_URL ?? '')
  .replace('%%SUPABASE_ANON_KEY%%', process.env.SUPABASE_ANON_KEY ?? '');
fs.writeFileSync(file, content);
console.log('Environment injected.');
```

Update `package.json`:
```json
"build": "node scripts/inject-env.js && ng build --configuration=production"
```

Vercel will run `npm run build` using the env vars set in the Vercel dashboard, which injects them into the browser bundle at build time. `process.env` is never used in the browser bundle itself.

> Note: The anon key is intentionally public — it only allows SELECT on the Supabase tables (RLS enforces this). Never expose the service role key.

- [ ] **Step 6: Write tests for api-client utility**

```ts
// src/app/core/utils/api-client.spec.ts
import { apiRequest } from './api-client';

global.fetch = jest.fn();

describe('apiRequest', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    localStorage.clear();
  });

  it('includes Authorization header when token exists', async () => {
    localStorage.setItem('admin_token', 'test-token');
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'ok' }),
    });

    await apiRequest('/api/test');

    expect(fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: 'Bearer test-token',
      }),
    }));
  });

  it('throws when response is not ok', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Não autorizado' }),
    });

    await expect(apiRequest('/api/test')).rejects.toThrow('Não autorizado');
  });
});
```

- [ ] **Step 7: Run the tests**

```bash
npm test -- --testPathPattern="api-client"
```

Expected: 2 tests pass.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add shared types, API client utility, and server-side JWT/Supabase helpers"
```

---

## Task 4: Authentication — Serverless + Service + Guard

**Files:**
- Create: `api/auth/login.ts`
- Create: `src/app/core/services/auth.service.ts`
- Create: `src/app/core/guards/auth.guard.ts`
- Test: `src/app/core/services/auth.service.spec.ts`
- Test: `src/app/core/guards/auth.guard.spec.ts`

- [ ] **Step 1: Write the login serverless function**

```ts
// api/auth/login.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { signToken } from '../_lib/jwt';

const schema = z.object({ password: z.string().min(1) });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: 'Pedido inválido' });

  if (result.data.password !== process.env['ADMIN_PASSWORD']) {
    return res.status(401).json({ message: 'Palavra-passe incorrecta' });
  }

  const token = await signToken();
  return res.status(200).json({ token });
}
```

- [ ] **Step 2: Write failing tests for AuthService**

```ts
// src/app/core/services/auth.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

global.fetch = jest.fn();

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
    localStorage.clear();
  });

  it('isAuthenticated() returns false when no token', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('isAuthenticated() returns false for invalid JWT', () => {
    localStorage.setItem('admin_token', 'not-a-jwt');
    expect(service.isAuthenticated()).toBe(false);
  });

  it('login() stores token on success', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'header.payload.sig' }),
    });
    await service.login('password');
    expect(localStorage.getItem('admin_token')).toBe('header.payload.sig');
  });

  it('login() throws on wrong password', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Palavra-passe incorrecta' }),
    });
    await expect(service.login('wrong')).rejects.toThrow('Palavra-passe incorrecta');
  });

  it('logout() removes token', () => {
    localStorage.setItem('admin_token', 'token');
    service.logout();
    expect(localStorage.getItem('admin_token')).toBeNull();
  });
});
```

- [ ] **Step 3: Run tests — expect FAIL**

```bash
npm test -- --testPathPattern="auth\.service"
```

Expected: FAIL — `AuthService` not found.

- [ ] **Step 4: Implement AuthService**

```ts
// src/app/core/services/auth.service.ts
import { Injectable, signal } from '@angular/core';
import { apiRequest } from '../utils/api-client';

const TOKEN_KEY = 'admin_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _authenticated = signal(this._checkToken());

  isAuthenticated(): boolean {
    return this._authenticated();
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  async login(password: string): Promise<void> {
    const { token } = await apiRequest<{ token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    localStorage.setItem(TOKEN_KEY, token);
    this._authenticated.set(true);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this._authenticated.set(false);
  }

  private _checkToken(): boolean {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    try {
      const [, payload] = token.split('.');
      const decoded = JSON.parse(atob(payload));
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
npm test -- --testPathPattern="auth\.service"
```

Expected: 5 tests pass.

- [ ] **Step 6: Write failing tests for AuthGuard**

```ts
// src/app/core/guards/auth.guard.spec.ts
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let authService: jest.Mocked<AuthService>;
  let router: jest.Mocked<Router>;

  beforeEach(() => {
    authService = { isAuthenticated: jest.fn() } as any;
    router = { createUrlTree: jest.fn().mockReturnValue('/login') } as any;

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('returns true when authenticated', () => {
    authService.isAuthenticated.mockReturnValue(true);
    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(result).toBe(true);
  });

  it('redirects to /login when not authenticated', () => {
    authService.isAuthenticated.mockReturnValue(false);
    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});
```

- [ ] **Step 7: Run tests — expect FAIL**

```bash
npm test -- --testPathPattern="auth\.guard"
```

- [ ] **Step 8: Implement AuthGuard**

```ts
// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.createUrlTree(['/login']);
};
```

- [ ] **Step 9: Run tests — expect PASS**

```bash
npm test -- --testPathPattern="auth\.guard"
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add authentication — serverless login, AuthService, and AuthGuard"
```

---

## Task 5: App Shell — Routing, Admin Layout, Login Page

**Files:**
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/app.component.ts`
- Modify: `src/app/app.config.ts`
- Create: `src/app/layout/admin-layout.component.ts`
- Create: `src/app/features/login/login.component.ts`

- [ ] **Step 1: Configure routes**

```ts
// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent) },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'quotes', pathMatch: 'full' },
      { path: 'quotes', loadComponent: () => import('./features/quotes/list/quotes-list.component').then(m => m.QuotesListComponent) },
      // IMPORTANT: 'quotes/new' must appear BEFORE 'quotes/:id' — Angular matches routes in order
      // and ':id' would capture the literal string "new" if listed first.
      { path: 'quotes/new', loadComponent: () => import('./features/quotes/new/quote-builder.component').then(m => m.QuoteBuilderComponent) },
      { path: 'quotes/:id', loadComponent: () => import('./features/quotes/detail/quote-detail.component').then(m => m.QuoteDetailComponent) },
      { path: 'services', loadComponent: () => import('./features/services/services-catalogue.component').then(m => m.ServicesCatalogueComponent) },
      { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent) },
    ],
  },
  { path: '', redirectTo: '/admin', pathMatch: 'full' },
  { path: '**', redirectTo: '/admin' },
];
```

- [ ] **Step 2: Configure app providers**

```ts
// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
  ],
};
```

- [ ] **Step 3: Simplify root component**

```ts
// src/app/app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class AppComponent {}
```

- [ ] **Step 4: Build Admin Layout**

```ts
// src/app/layout/admin-layout.component.ts
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="admin-shell">
      <nav class="sidebar">
        <div class="brand">Facturação</div>
        <a routerLink="/admin/quotes" routerLinkActive="active">Orçamentos</a>
        <a routerLink="/admin/services" routerLinkActive="active">Serviços</a>
        <a routerLink="/admin/settings" routerLinkActive="active">Definições</a>
        <button class="logout" (click)="logout()">Sair</button>
      </nav>
      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .admin-shell { display: flex; min-height: 100vh; }
    .sidebar { width: 200px; background: #1e293b; color: #f1f5f9; display: flex; flex-direction: column; padding: 1.5rem 1rem; gap: 0.5rem; }
    .brand { font-weight: 700; font-size: 1.1rem; margin-bottom: 1rem; color: #38bdf8; }
    .sidebar a { color: #94a3b8; text-decoration: none; padding: 0.5rem 0.75rem; border-radius: 6px; }
    .sidebar a.active { color: #f1f5f9; background: #334155; }
    .logout { margin-top: auto; background: none; border: 1px solid #475569; color: #94a3b8; padding: 0.5rem; border-radius: 6px; cursor: pointer; }
    .content { flex: 1; padding: 2rem; background: #f8fafc; }
  `],
})
export class AdminLayoutComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
```

> Note: Add `import { ChangeDetectionStrategy } from '@angular/core';` at the top.

- [ ] **Step 5: Build Login Page**

```ts
// src/app/features/login/login.component.ts
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login-wrap">
      <div class="login-card">
        <h1>Acesso Restrito</h1>
        <form (ngSubmit)="submit()">
          <label>Palavra-passe</label>
          <input type="password" [ngModel]="password()" (ngModelChange)="password.set($event)" name="password" required autofocus />
          @if (error()) {
            <p class="error">{{ error() }}</p>
          }
          <button type="submit" [disabled]="loading()">
            {{ loading() ? 'A entrar...' : 'Entrar' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-wrap { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f1f5f9; }
    .login-card { background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,.08); width: 320px; }
    h1 { font-size: 1.25rem; margin-bottom: 1.5rem; color: #1e293b; }
    label { display: block; font-size: .875rem; color: #64748b; margin-bottom: .25rem; }
    input { width: 100%; padding: .625rem .75rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 1rem; box-sizing: border-box; margin-bottom: .75rem; }
    button { width: 100%; padding: .75rem; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 1rem; cursor: pointer; }
    button:disabled { opacity: .6; }
    .error { color: #ef4444; font-size: .875rem; margin-bottom: .75rem; }
  `],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  password = signal('');
  loading = signal(false);
  error = signal('');

  async submit() {
    this.loading.set(true);
    this.error.set('');
    try {
      await this.auth.login(this.password());
      this.router.navigate(['/admin']);
    } catch (e: any) {
      this.error.set(e.message ?? 'Erro ao entrar');
    } finally {
      this.loading.set(false);
    }
  }
}
```

- [ ] **Step 6: Verify dev server starts**

```bash
npm start
```

Navigate to `http://localhost:4200` — should redirect to `/login` and show the login page.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add app shell, routing, admin layout, and login page"
```

---

## Task 6: Settings — Serverless + Service + Component

**Files:**
- Create: `api/settings/index.ts`
- Create: `src/app/core/services/settings.service.ts`
- Create: `src/app/features/settings/settings.component.ts`
- Test: `src/app/core/services/settings.service.spec.ts`

- [ ] **Step 1: Write the serverless PUT /api/settings**

```ts
// api/settings/index.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { verifyJwt } from '../_lib/jwt';
import { createAdminClient } from '../_lib/supabase';

const schema = z.object({
  hourly_rate: z.number().min(1).max(500).optional(),
  owner_email: z.string().email().optional(),
  vat_mode: z.enum(['exempt', 'standard']).optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT') return res.status(405).end();
  if (!await verifyJwt(req)) return res.status(401).json({ message: 'Não autorizado' });

  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: 'Dados inválidos' });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('settings')
    .upsert({ id: 1, ...result.data })
    .select()
    .single();

  if (error) return res.status(500).json({ message: 'Erro ao guardar' });
  return res.status(200).json(data);
}
```

- [ ] **Step 2: Write failing tests for SettingsService**

```ts
// src/app/core/services/settings.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { SettingsService } from './settings.service';

global.fetch = jest.fn();

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SettingsService);
    localStorage.setItem('admin_token', 'valid-token');
  });

  afterEach(() => localStorage.clear());

  it('updateSettings() calls PUT /api/settings', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, hourly_rate: 20, owner_email: 'me@test.pt', vat_mode: 'exempt' }),
    });
    const result = await service.updateSettings({ hourly_rate: 20 });
    expect(fetch).toHaveBeenCalledWith('/api/settings', expect.objectContaining({ method: 'PUT' }));
    expect(result.hourly_rate).toBe(20);
  });
});
```

- [ ] **Step 3: Run — expect FAIL**

```bash
npm test -- --testPathPattern="settings\.service"
```

- [ ] **Step 4: Implement SettingsService**

```ts
// src/app/core/services/settings.service.ts
import { Injectable, inject } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { apiRequest } from '../utils/api-client';
import type { Settings } from '../models';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);

  async getSettings(): Promise<Settings> {
    const { data, error } = await this.supabase.from('settings').select('*').single();
    if (error) throw new Error('Erro ao carregar definições');
    return data as Settings;
  }

  async updateSettings(payload: Partial<Omit<Settings, 'id'>>): Promise<Settings> {
    return apiRequest<Settings>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }
}
```

- [ ] **Step 5: Run — expect PASS**

```bash
npm test -- --testPathPattern="settings\.service"
```

- [ ] **Step 6: Build Settings Component**

```ts
// src/app/features/settings/settings.component.ts
import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../core/services/settings.service';
import type { Settings } from '../../core/models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>Definições</h2>
    @if (settings()) {
      <form (ngSubmit)="save()" class="settings-form">
        <section>
          <h3>Custo por hora</h3>
          <div class="slider-row">
            <input type="range" min="10" max="100" step="1"
              [(ngModel)]="settings()!.hourly_rate" name="hourly_rate" />
            <span class="rate-value">€{{ settings()!.hourly_rate }}/hora</span>
          </div>
        </section>
        <section>
          <h3>IVA</h3>
          <label class="radio">
            <input type="radio" name="vat_mode" value="exempt"
              [(ngModel)]="settings()!.vat_mode" />
            Isento (art.º 53.º CIVA)
          </label>
          <label class="radio">
            <input type="radio" name="vat_mode" value="standard"
              [(ngModel)]="settings()!.vat_mode" />
            23% IVA
          </label>
        </section>
        <section>
          <h3>Email do proprietário</h3>
          <input type="email" [(ngModel)]="settings()!.owner_email" name="owner_email"
            placeholder="o-seu-email@dominio.pt" />
        </section>
        <button type="submit" [disabled]="saving()">
          {{ saving() ? 'A guardar...' : 'Guardar definições' }}
        </button>
        @if (saved()) {
          <p class="success">Definições guardadas.</p>
        }
      </form>
    } @else {
      <p>A carregar...</p>
    }
  `,
  styles: [`
    h2 { margin-bottom: 1.5rem; }
    section { background: white; padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem; }
    h3 { font-size: .9rem; color: #64748b; margin-bottom: 1rem; }
    .slider-row { display: flex; align-items: center; gap: 1rem; }
    input[type=range] { flex: 1; }
    .rate-value { font-size: 1.5rem; font-weight: 700; color: #1e293b; min-width: 100px; }
    .radio { display: flex; align-items: center; gap: .5rem; margin-bottom: .5rem; cursor: pointer; }
    input[type=email] { width: 100%; padding: .625rem; border: 1px solid #e2e8f0; border-radius: 6px; }
    button { background: #3b82f6; color: white; padding: .75rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; }
    .success { color: #16a34a; margin-top: .75rem; }
  `],
})
export class SettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  settings = signal<Settings | null>(null);
  saving = signal(false);
  saved = signal(false);

  async ngOnInit() {
    this.settings.set(await this.settingsService.getSettings());
  }

  async save() {
    const s = this.settings();
    if (!s) return;
    this.saving.set(true);
    this.saved.set(false);
    await this.settingsService.updateSettings({
      hourly_rate: s.hourly_rate,
      owner_email: s.owner_email,
      vat_mode: s.vat_mode,
    });
    this.saving.set(false);
    this.saved.set(true);
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add settings page — hourly rate slider, VAT mode, owner email"
```

---

## Task 7: Service Catalogue — Serverless + Service + Component

**Files:**
- Create: `api/services/index.ts`
- Create: `api/services/[id].ts`
- Create: `src/app/core/services/service-catalogue.service.ts`
- Create: `src/app/features/services/services-catalogue.component.ts`
- Test: `src/app/core/services/service-catalogue.service.spec.ts`

- [ ] **Step 1: Write serverless POST /api/services**

```ts
// api/services/index.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { verifyJwt } from '../_lib/jwt';
import { createAdminClient } from '../_lib/supabase';

const schema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  default_hours: z.number().min(0),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!await verifyJwt(req)) return res.status(401).json({ message: 'Não autorizado' });

  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: 'Dados inválidos' });

  const supabase = createAdminClient();
  const { data, error } = await supabase.from('services').insert(result.data).select().single();
  if (error) return res.status(500).json({ message: 'Erro ao criar serviço' });
  return res.status(201).json(data);
}
```

- [ ] **Step 2: Write serverless PUT/DELETE /api/services/:id**

```ts
// api/services/[id].ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { verifyJwt } from '../_lib/jwt';
import { createAdminClient } from '../_lib/supabase';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  default_hours: z.number().min(0).optional(),
  active: z.boolean().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!await verifyJwt(req)) return res.status(401).json({ message: 'Não autorizado' });
  const { id } = req.query as { id: string };
  const supabase = createAdminClient();

  if (req.method === 'PUT') {
    const result = updateSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: 'Dados inválidos' });
    const { data, error } = await supabase.from('services').update(result.data).eq('id', id).select().single();
    if (error) return res.status(500).json({ message: 'Erro ao actualizar' });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    // Archive instead of delete
    const { error } = await supabase.from('services').update({ active: false }).eq('id', id);
    if (error) return res.status(500).json({ message: 'Erro ao arquivar' });
    return res.status(204).end();
  }

  return res.status(405).end();
}
```

- [ ] **Step 3: Write failing tests for ServiceCatalogueService**

```ts
// src/app/core/services/service-catalogue.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { ServiceCatalogueService } from './service-catalogue.service';

global.fetch = jest.fn();

describe('ServiceCatalogueService', () => {
  let service: ServiceCatalogueService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiceCatalogueService);
    localStorage.setItem('admin_token', 'valid-token');
    (fetch as jest.Mock).mockReset();
  });

  it('createService() calls POST /api/services', async () => {
    const mockService = { id: '1', name: 'SEO', category: 'SEO', default_hours: 4, active: true, created_at: '' };
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockService });

    const result = await service.createService({ name: 'SEO', category: 'SEO', default_hours: 4 });
    expect(fetch).toHaveBeenCalledWith('/api/services', expect.objectContaining({ method: 'POST' }));
    expect(result.name).toBe('SEO');
  });

  it('archiveService() calls DELETE /api/services/:id', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });
    await service.archiveService('uuid-123');
    expect(fetch).toHaveBeenCalledWith('/api/services/uuid-123', expect.objectContaining({ method: 'DELETE' }));
  });
});
```

- [ ] **Step 4: Run — expect FAIL**

```bash
npm test -- --testPathPattern="service-catalogue\.service"
```

- [ ] **Step 5: Implement ServiceCatalogueService**

```ts
// src/app/core/services/service-catalogue.service.ts
import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { apiRequest } from '../utils/api-client';
import type { Service } from '../models';

@Injectable({ providedIn: 'root' })
export class ServiceCatalogueService {
  private supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);

  async getServices(): Promise<Service[]> {
    const { data, error } = await this.supabase
      .from('services')
      .select('*')
      .order('category')
      .order('name');
    if (error) throw new Error('Erro ao carregar serviços');
    return data as Service[];
  }

  async createService(payload: { name: string; category: string; default_hours: number }): Promise<Service> {
    return apiRequest<Service>('/api/services', { method: 'POST', body: JSON.stringify(payload) });
  }

  async updateService(id: string, payload: Partial<{ name: string; category: string; default_hours: number }>): Promise<Service> {
    return apiRequest<Service>(`/api/services/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  }

  async archiveService(id: string): Promise<void> {
    await apiRequest<void>(`/api/services/${id}`, { method: 'DELETE' });
  }
}
```

- [ ] **Step 6: Run — expect PASS**

```bash
npm test -- --testPathPattern="service-catalogue\.service"
```

- [ ] **Step 7: Build Services Catalogue Component**

```ts
// src/app/features/services/services-catalogue.component.ts
import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ServiceCatalogueService } from '../../core/services/service-catalogue.service';
import type { Service } from '../../core/models';

@Component({
  selector: 'app-services-catalogue',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <h2>Catálogo de Serviços</h2>
      <button (click)="showForm.set(true)" class="btn-primary">+ Novo Serviço</button>
    </div>

    @if (showForm()) {
      <form class="inline-form" (ngSubmit)="save()">
        <input [(ngModel)]="form.name" name="name" placeholder="Nome do serviço" required />
        <input [(ngModel)]="form.category" name="category" placeholder="Categoria" list="cats" required />
        <datalist id="cats">
          @for (cat of categories(); track cat) { <option [value]="cat" /> }
        </datalist>
        <input type="number" [(ngModel)]="form.default_hours" name="default_hours" placeholder="Horas" min="0" step="0.5" required />
        <button type="submit">{{ editingId() ? 'Actualizar' : 'Criar' }}</button>
        <button type="button" (click)="cancelForm()">Cancelar</button>
      </form>
    }

    @for (category of categories(); track category) {
      <div class="category-block">
        <h3>{{ category }}</h3>
        <table>
          <thead><tr><th>Serviço</th><th>Horas padrão</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            @for (s of servicesByCategory()[category]; track s.id) {
              <tr [class.archived]="!s.active">
                <td>{{ s.name }}</td>
                <td>{{ s.default_hours }}h</td>
                <td>{{ s.active ? 'Activo' : 'Arquivado' }}</td>
                <td class="actions">
                  <button (click)="edit(s)">Editar</button>
                  @if (s.active) {
                    <button (click)="archive(s.id)" class="danger">Arquivar</button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .inline-form { background: white; padding: 1rem; border-radius: 8px; display: flex; gap: .75rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .inline-form input { padding: .5rem; border: 1px solid #e2e8f0; border-radius: 6px; }
    .category-block { background: white; border-radius: 8px; padding: 1rem 1.5rem; margin-bottom: 1rem; }
    h3 { color: #64748b; font-size: .8rem; text-transform: uppercase; letter-spacing: .05em; margin-bottom: .75rem; }
    table { width: 100%; border-collapse: collapse; }
    td, th { padding: .5rem .75rem; text-align: left; border-bottom: 1px solid #f1f5f9; }
    .archived { opacity: .5; }
    .actions { display: flex; gap: .5rem; }
    .btn-primary { background: #3b82f6; color: white; border: none; padding: .5rem 1rem; border-radius: 6px; cursor: pointer; }
    button { padding: .375rem .75rem; border-radius: 6px; border: 1px solid #e2e8f0; cursor: pointer; }
    .danger { color: #ef4444; border-color: #fca5a5; }
  `],
})
export class ServicesCatalogueComponent implements OnInit {
  private svc = inject(ServiceCatalogueService);

  services = signal<Service[]>([]);
  showForm = signal(false);
  editingId = signal<string | null>(null);
  form = { name: '', category: '', default_hours: 0 };

  categories = signal<string[]>([]);
  servicesByCategory = signal<Record<string, Service[]>>({});

  async ngOnInit() { await this.load(); }

  async load() {
    // Note: RLS policy for anon key filters active=true, so archived services are not returned.
    // The admin catalogue page calls getServices() which uses the anon key.
    // To show archived services in the admin UI, refactor getServices() to go through
    // a serverless endpoint (using the service role key) instead of direct Supabase read.
    const all = await this.svc.getServices();
    this.services.set(all);
    const cats = [...new Set(all.map(s => s.category))].sort();
    this.categories.set(cats);
    this.servicesByCategory.set(Object.fromEntries(cats.map(c => [c, all.filter(s => s.category === c)])));
  }

  edit(s: Service) {
    this.editingId.set(s.id);
    this.form = { name: s.name, category: s.category, default_hours: s.default_hours };
    this.showForm.set(true);
  }

  cancelForm() { this.showForm.set(false); this.editingId.set(null); this.form = { name: '', category: '', default_hours: 0 }; }

  async save() {
    const id = this.editingId();
    if (id) {
      await this.svc.updateService(id, this.form);
    } else {
      await this.svc.createService(this.form);
    }
    this.cancelForm();
    await this.load();
  }

  async archive(id: string) {
    await this.svc.archiveService(id);
    await this.load();
  }
}
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add service catalogue — CRUD with inline form and archive support"
```

---

## Task 8: Quote Service + Serverless Create/Update

**Files:**
- Create: `api/quotes/index.ts`
- Create: `api/quotes/[id]/index.ts`
- Create: `src/app/core/services/quote.service.ts`
- Test: `src/app/core/services/quote.service.spec.ts`

- [ ] **Step 1: Write serverless POST /api/quotes (create)**

```ts
// api/quotes/index.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { verifyJwt } from '../_lib/jwt';
import { createAdminClient } from '../_lib/supabase';

const itemSchema = z.object({
  service_id: z.string(),
  name: z.string(),
  hours: z.number().min(0),
  subtotal: z.number().min(0),
});

const schema = z.object({
  client_name: z.string().min(1),
  client_email: z.string().email(),
  hourly_rate: z.number().min(1),
  items: z.array(itemSchema).min(1),
  notes: z.string().default(''),
});

async function generateNumber(supabase: ReturnType<typeof import('../_lib/supabase').createAdminClient>, prefix: 'ORC' | 'FAT'): Promise<string> {
  const year = new Date().getFullYear();
  const likePattern = `${prefix}-${year}-%`;
  const { data } = await supabase
    .from('quotes')
    .select('number')
    .like('number', likePattern)
    .order('number', { ascending: false })
    .limit(1);

  const lastNum = data?.[0]?.number;
  const next = lastNum ? parseInt(lastNum.split('-')[2]) + 1 : 1;
  return `${prefix}-${year}-${String(next).padStart(3, '0')}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!await verifyJwt(req)) return res.status(401).json({ message: 'Não autorizado' });

  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: 'Dados inválidos' });

  const supabase = createAdminClient();
  const number = await generateNumber(supabase, 'ORC');
  const { items, hourly_rate } = result.data;
  const total_hours = items.reduce((sum, i) => sum + i.hours, 0);
  const total_amount = total_hours * hourly_rate;

  const { data, error } = await supabase
    .from('quotes')
    .insert({ ...result.data, number, total_hours, total_amount })
    .select()
    .single();

  if (error) return res.status(500).json({ message: 'Erro ao criar orçamento' });
  return res.status(201).json(data);
}
```

- [ ] **Step 2: Write serverless PUT /api/quotes/:id**

```ts
// api/quotes/[id]/index.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { verifyJwt } from '../../_lib/jwt';
import { createAdminClient } from '../../_lib/supabase';

const itemSchema = z.object({
  service_id: z.string(),
  name: z.string(),
  hours: z.number().min(0),
  subtotal: z.number().min(0),
});

const schema = z.object({
  client_name: z.string().min(1).optional(),
  client_email: z.string().email().optional(),
  hourly_rate: z.number().min(1).optional(),
  items: z.array(itemSchema).optional(),
  notes: z.string().optional(),
  status: z.enum(['invoice']).optional(),  // can only promote, not demote
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT') return res.status(405).end();
  if (!await verifyJwt(req)) return res.status(401).json({ message: 'Não autorizado' });

  const { id } = req.query as { id: string };
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: 'Dados inválidos' });

  const supabase = createAdminClient();
  const updates: Record<string, unknown> = { ...result.data };

  // Recompute totals if items or rate changed
  if (result.data.items || result.data.hourly_rate) {
    const { data: current } = await supabase.from('quotes').select('items, hourly_rate').eq('id', id).single();
    const items = result.data.items ?? (current?.items as any[]) ?? [];
    const rate = result.data.hourly_rate ?? current?.hourly_rate ?? 15;
    updates['total_hours'] = items.reduce((sum: number, i: any) => sum + i.hours, 0);
    updates['total_amount'] = (updates['total_hours'] as number) * rate;
  }

  // Convert to invoice: generate FAT number
  if (result.data.status === 'invoice') {
    const { data: current } = await supabase.from('quotes').select('number, status').eq('id', id).single();
    if (current?.status === 'quote') {
      const year = new Date().getFullYear();
      const { data: lastFat } = await supabase
        .from('quotes')
        .select('number')
        .like('number', `FAT-${year}-%`)
        .order('number', { ascending: false })
        .limit(1);
      const next = lastFat?.[0] ? parseInt(lastFat[0].number.split('-')[2]) + 1 : 1;
      updates['number'] = `FAT-${year}-${String(next).padStart(3, '0')}`;
      updates['quote_number'] = current.number;
    }
  }

  const { data, error } = await supabase.from('quotes').update(updates).eq('id', id).select().single();
  if (error) return res.status(500).json({ message: 'Erro ao actualizar' });
  return res.status(200).json(data);
}
```

- [ ] **Step 3: Write failing tests for QuoteService**

```ts
// src/app/core/services/quote.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { QuoteService } from './quote.service';

global.fetch = jest.fn();

const mockQuote = {
  id: 'uuid-1', number: 'ORC-2026-001', client_name: 'Clínica X',
  client_email: 'info@clinica.pt', status: 'quote', hourly_rate: 15,
  items: [], notes: '', total_hours: 0, total_amount: 0,
  quote_number: null, sent_at: null, created_at: '', updated_at: '',
};

describe('QuoteService', () => {
  let service: QuoteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuoteService);
    localStorage.setItem('admin_token', 'valid-token');
    (fetch as jest.Mock).mockReset();
  });

  it('createQuote() calls POST /api/quotes', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockQuote });
    const result = await service.createQuote({
      client_name: 'Clínica X', client_email: 'info@clinica.pt',
      hourly_rate: 15, items: [], notes: '',
    });
    expect(fetch).toHaveBeenCalledWith('/api/quotes', expect.objectContaining({ method: 'POST' }));
    expect(result.number).toBe('ORC-2026-001');
  });

  it('convertToInvoice() calls PUT /api/quotes/:id with status invoice', async () => {
    const invoice = { ...mockQuote, status: 'invoice', number: 'FAT-2026-001' };
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => invoice });
    const result = await service.convertToInvoice('uuid-1');
    expect(fetch).toHaveBeenCalledWith('/api/quotes/uuid-1', expect.objectContaining({ method: 'PUT' }));
    expect(result.status).toBe('invoice');
  });
});
```

- [ ] **Step 4: Run — expect FAIL**

```bash
npm test -- --testPathPattern="quote\.service"
```

- [ ] **Step 5: Implement QuoteService**

```ts
// src/app/core/services/quote.service.ts
import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { apiRequest } from '../utils/api-client';
import type { Quote, CreateQuotePayload, UpdateQuotePayload } from '../models';

@Injectable({ providedIn: 'root' })
export class QuoteService {
  private supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);

  async getQuotes(): Promise<Quote[]> {
    const { data, error } = await this.supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error('Erro ao carregar orçamentos');
    return data as Quote[];
  }

  async getQuote(id: string): Promise<Quote> {
    const { data, error } = await this.supabase.from('quotes').select('*').eq('id', id).single();
    if (error) throw new Error('Orçamento não encontrado');
    return data as Quote;
  }

  async createQuote(payload: CreateQuotePayload): Promise<Quote> {
    return apiRequest<Quote>('/api/quotes', { method: 'POST', body: JSON.stringify(payload) });
  }

  async updateQuote(id: string, payload: UpdateQuotePayload): Promise<Quote> {
    return apiRequest<Quote>(`/api/quotes/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  }

  async convertToInvoice(id: string): Promise<Quote> {
    return apiRequest<Quote>(`/api/quotes/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'invoice' }) });
  }
}
```

- [ ] **Step 6: Run — expect PASS**

```bash
npm test -- --testPathPattern="quote\.service"
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add quote service and serverless create/update endpoints with number generation"
```

---

## Task 9: Quotes List Component

**Files:**
- Create: `src/app/features/quotes/list/quotes-list.component.ts`
- Test: `src/app/features/quotes/list/quotes-list.component.spec.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/app/features/quotes/list/quotes-list.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import { QuotesListComponent } from './quotes-list.component';
import { QuoteService } from '../../../core/services/quote.service';
import { QuotePdfService } from '../../../core/services/quote-pdf.service';
import { provideRouter } from '@angular/router';

const mockQuotes = [
  { id: '1', number: 'ORC-2026-001', client_name: 'Clínica X', client_email: 'x@test.pt',
    status: 'quote', hourly_rate: 15, items: [], notes: '', total_hours: 8, total_amount: 120,
    quote_number: null, sent_at: null, created_at: '2026-03-18T10:00:00Z', updated_at: '2026-03-18T10:00:00Z' },
];

describe('QuotesListComponent', () => {
  it('renders quotes loaded from QuoteService', async () => {
    await render(QuotesListComponent, {
      providers: [
        provideRouter([]),
        { provide: QuoteService, useValue: { getQuotes: jest.fn().mockResolvedValue(mockQuotes) } },
        { provide: QuotePdfService, useValue: { generatePdf: jest.fn() } },
      ],
    });
    expect(await screen.findByText('ORC-2026-001')).toBeTruthy();
    expect(screen.getByText('Clínica X')).toBeTruthy();
  });

  it('shows empty state when no quotes', async () => {
    await render(QuotesListComponent, {
      providers: [
        provideRouter([]),
        { provide: QuoteService, useValue: { getQuotes: jest.fn().mockResolvedValue([]) } },
        { provide: QuotePdfService, useValue: { generatePdf: jest.fn() } },
      ],
    });
    expect(await screen.findByText(/Ainda não há orçamentos/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test -- --testPathPattern="quotes-list\.component"
```

- [ ] **Step 3: Build the component**

```ts
// src/app/features/quotes/list/quotes-list.component.ts
import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { QuoteService } from '../../../core/services/quote.service';
import { QuotePdfService } from '../../../core/services/quote-pdf.service';
import type { Quote } from '../../../core/models';

@Component({
  selector: 'app-quotes-list',
  standalone: true,
  imports: [RouterLink, DatePipe, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <h2>Orçamentos & Faturas</h2>
      <a routerLink="/admin/quotes/new" class="btn-primary">+ Novo Orçamento</a>
    </div>

    @if (quotes().length === 0) {
      <p class="empty">Ainda não há orçamentos. Cria o primeiro!</p>
    } @else {
      <table class="quotes-table">
        <thead>
          <tr>
            <th>Número</th>
            <th>Cliente</th>
            <th>Estado</th>
            <th>Total</th>
            <th>Data</th>
            <th>Enviado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (q of quotes(); track q.id) {
            <tr>
              <td><a [routerLink]="['/admin/quotes', q.id]">{{ q.number }}</a></td>
              <td>{{ q.client_name }}</td>
              <td><span class="badge" [class.invoice]="q.status === 'invoice'">
                {{ q.status === 'invoice' ? 'Fatura' : 'Orçamento' }}
              </span></td>
              <td>{{ q.total_amount | currency:'EUR':'symbol':'1.2-2':'pt' }}</td>
              <td>{{ q.created_at | date:'dd/MM/yyyy' }}</td>
              <td>{{ q.sent_at ? (q.sent_at | date:'dd/MM/yyyy') : '—' }}</td>
              <td><button (click)="downloadPdf(q)" class="btn-sm">PDF</button></td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .btn-primary { background: #3b82f6; color: white; padding: .5rem 1rem; border-radius: 6px; text-decoration: none; }
    .quotes-table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; }
    th, td { padding: .75rem 1rem; text-align: left; border-bottom: 1px solid #f1f5f9; }
    th { background: #f8fafc; font-size: .8rem; color: #64748b; text-transform: uppercase; }
    .badge { padding: .25rem .75rem; border-radius: 999px; font-size: .75rem; background: #fef3c7; color: #92400e; }
    .badge.invoice { background: #dcfce7; color: #166534; }
    .btn-sm { padding: .25rem .75rem; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; font-size: .8rem; }
    .empty { color: #94a3b8; text-align: center; padding: 3rem; }
    a { color: #3b82f6; text-decoration: none; }
  `],
})
export class QuotesListComponent implements OnInit {
  private quoteService = inject(QuoteService);
  private pdfService = inject(QuotePdfService);
  quotes = signal<Quote[]>([]);

  async ngOnInit() {
    this.quotes.set(await this.quoteService.getQuotes());
  }

  downloadPdf(q: Quote) {
    this.pdfService.generatePdf(q);
  }
}
```

> Note: `QuotePdfService` is implemented in Task 11. The list will compile once that class exists.

- [ ] **Step 4: Run test — expect PASS**

```bash
npm test -- --testPathPattern="quotes-list\.component"
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add quotes list component"
```

---

## Task 10: Shared Quote Preview + PDF Service

**Files:**
- Create: `src/app/shared/components/quote-preview/quote-preview.component.ts`
- Create: `src/app/core/services/quote-pdf.service.ts`
- Test: `src/app/core/services/quote-pdf.service.spec.ts`

- [ ] **Step 1: Build Quote Preview Component (display-only)**

```ts
// src/app/shared/components/quote-preview/quote-preview.component.ts
import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import type { Quote } from '../../../core/models';

@Component({
  selector: 'app-quote-preview',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="preview">
      <div class="preview-header">
        <div class="agency">A Minha Agência Web</div>
        <div class="doc-meta">
          <div class="doc-number">{{ quote.number }}</div>
          <div class="doc-date">{{ quote.created_at | date:'dd/MM/yyyy' }}</div>
        </div>
      </div>
      <div class="client-info">
        <strong>{{ quote.client_name }}</strong><br />
        {{ quote.client_email }}
      </div>
      <table class="items-table">
        <thead>
          <tr><th>Serviço</th><th>Horas</th><th>€/hora</th><th>Subtotal</th></tr>
        </thead>
        <tbody>
          @for (item of quote.items; track item.service_id) {
            <tr>
              <td>{{ item.name }}</td>
              <td>{{ item.hours }}h</td>
              <td>{{ quote.hourly_rate | currency:'EUR':'symbol':'1.2-2':'pt' }}</td>
              <td>{{ item.subtotal | currency:'EUR':'symbol':'1.2-2':'pt' }}</td>
            </tr>
          }
        </tbody>
      </table>
      <div class="totals">
        <div class="total-row">
          <span>Subtotal</span>
          <span>{{ quote.total_amount | currency:'EUR':'symbol':'1.2-2':'pt' }}</span>
        </div>
        @if (vatMode === 'exempt') {
          <div class="vat-row exempt">Isento nos termos do art.º 53.º do CIVA</div>
        } @else {
          <div class="total-row">
            <span>IVA 23%</span>
            <span>{{ quote.total_amount * 0.23 | currency:'EUR':'symbol':'1.2-2':'pt' }}</span>
          </div>
          <div class="total-row grand">
            <span>Total</span>
            <span>{{ quote.total_amount * 1.23 | currency:'EUR':'symbol':'1.2-2':'pt' }}</span>
          </div>
        }
      </div>
      @if (quote.notes) {
        <div class="notes"><strong>Notas:</strong> {{ quote.notes }}</div>
      }
    </div>
  `,
  styles: [`
    .preview { font-family: system-ui, sans-serif; font-size: .9rem; color: #1e293b; }
    .preview-header { display: flex; justify-content: space-between; margin-bottom: 1.5rem; }
    .agency { font-weight: 700; font-size: 1.1rem; }
    .doc-number { font-weight: 600; }
    .doc-date { color: #64748b; font-size: .85rem; }
    .client-info { margin-bottom: 1.5rem; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
    .items-table th { background: #f1f5f9; padding: .5rem; text-align: left; font-size: .8rem; }
    .items-table td { padding: .5rem; border-bottom: 1px solid #f1f5f9; }
    .totals { text-align: right; padding-top: .75rem; border-top: 2px solid #e2e8f0; }
    .total-row { display: flex; justify-content: flex-end; gap: 2rem; padding: .25rem 0; }
    .grand { font-weight: 700; font-size: 1.1rem; border-top: 1px solid #1e293b; padding-top: .5rem; }
    .vat-row.exempt { font-size: .75rem; color: #64748b; margin-top: .5rem; }
    .notes { margin-top: 1rem; padding: .75rem; background: #f8fafc; border-radius: 6px; }
  `],
})
export class QuotePreviewComponent {
  quote = input.required<Quote>();
  vatMode = input<'exempt' | 'standard'>('exempt');
}
```

- [ ] **Step 2: Write failing tests for QuotePdfService**

```ts
// src/app/core/services/quote-pdf.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { QuotePdfService } from './quote-pdf.service';
import type { Quote } from '../models';

// Mock jsPDF
jest.mock('jspdf', () => {
  return {
    jsPDF: jest.fn().mockImplementation(() => ({
      setFontSize: jest.fn(),
      setFont: jest.fn(),
      text: jest.fn(),
      line: jest.fn(),
      save: jest.fn(),
      internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
    })),
  };
});

const mockQuote: Quote = {
  id: 'uuid-1', number: 'ORC-2026-001', client_name: 'Test Client',
  client_email: 'test@example.com', status: 'quote', hourly_rate: 15,
  items: [{ service_id: 's1', name: 'Homepage', hours: 8, subtotal: 120 }],
  notes: '', total_hours: 8, total_amount: 120,
  quote_number: null, sent_at: null, created_at: '2026-03-18', updated_at: '2026-03-18',
};

describe('QuotePdfService', () => {
  let service: QuotePdfService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuotePdfService);
  });

  it('generatePdf() calls jsPDF and triggers save', () => {
    const { jsPDF } = require('jspdf');
    service.generatePdf(mockQuote);
    const instance = jsPDF.mock.results[0].value;
    expect(instance.save).toHaveBeenCalledWith('ORC-2026-001.pdf');
    expect(instance.text).toHaveBeenCalled();
  });

  it('generatePdf() includes client name in the document', () => {
    const { jsPDF } = require('jspdf');
    service.generatePdf(mockQuote);
    const instance = jsPDF.mock.results[0].value;
    const calls = instance.text.mock.calls.map((c: any) => c[0]);
    expect(calls.some((t: string) => t.includes('Test Client'))).toBe(true);
  });
});
```

- [ ] **Step 3: Run — expect FAIL**

```bash
npm test -- --testPathPattern="quote-pdf\.service"
```

- [ ] **Step 4: Implement QuotePdfService**

```ts
// src/app/core/services/quote-pdf.service.ts
import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import type { Quote } from '../models';

const MARGIN = 20;
const PAGE_W = 210;
const COL = { service: MARGIN, hours: 120, rate: 150, sub: 180 };

@Injectable({ providedIn: 'root' })
export class QuotePdfService {
  generatePdf(quote: Quote, vatMode: 'exempt' | 'standard' = 'exempt'): void {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = MARGIN;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('A Minha Agência Web', MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(quote.number, PAGE_W - MARGIN, y, { align: 'right' });
    y += 5;
    doc.text(new Date(quote.created_at).toLocaleDateString('pt-PT'), PAGE_W - MARGIN, y, { align: 'right' });
    y += 12;

    // Client
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(quote.client_name, MARGIN, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(quote.client_email, MARGIN, y);
    y += 12;

    // Table header
    doc.setFillColor(241, 245, 249);
    doc.rect(MARGIN, y - 4, PAGE_W - MARGIN * 2, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Serviço', COL.service, y);
    doc.text('Horas', COL.hours, y);
    doc.text('€/hora', COL.rate, y);
    doc.text('Subtotal', COL.sub, y);
    y += 6;

    // Items
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    for (const item of quote.items) {
      doc.text(item.name, COL.service, y);
      doc.text(`${item.hours}h`, COL.hours, y);
      doc.text(this._eur(quote.hourly_rate), COL.rate, y);
      doc.text(this._eur(item.subtotal), COL.sub, y);
      y += 7;
      doc.setDrawColor(241, 245, 249);
      doc.line(MARGIN, y - 2, PAGE_W - MARGIN, y - 2);
    }

    y += 4;
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 6;

    // Totals (right-aligned)
    const right = PAGE_W - MARGIN;
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal', right - 60, y);
    doc.text(this._eur(quote.total_amount), right, y, { align: 'right' });
    y += 6;

    if (vatMode === 'exempt') {
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Isento nos termos do art.º 53.º do CIVA', MARGIN, y);
      doc.setTextColor(0);
      doc.setFontSize(10);
    } else {
      const vat = quote.total_amount * 0.23;
      doc.text('IVA 23%', right - 60, y);
      doc.text(this._eur(vat), right, y, { align: 'right' });
      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Total', right - 60, y);
      doc.text(this._eur(quote.total_amount * 1.23), right, y, { align: 'right' });
    }

    y += 10;
    if (quote.notes) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Notas: ${quote.notes}`, MARGIN, y);
      doc.setTextColor(0);
    }

    doc.save(`${quote.number}.pdf`);
  }

  private _eur(value: number): string {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  }
}
```

- [ ] **Step 5: Run — expect PASS**

```bash
npm test -- --testPathPattern="quote-pdf\.service"
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add quote preview component and jsPDF generation service"
```

---

## Task 11: Quote Builder Component

**Files:**
- Create: `src/app/features/quotes/new/quote-builder.component.ts`

- [ ] **Step 1: Build the Quote Builder**

```ts
// src/app/features/quotes/new/quote-builder.component.ts
import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { QuoteService } from '../../../core/services/quote.service';
import { ServiceCatalogueService } from '../../../core/services/service-catalogue.service';
import { SettingsService } from '../../../core/services/settings.service';
import { QuotePdfService } from '../../../core/services/quote-pdf.service';
import { QuotePreviewComponent } from '../../../shared/components/quote-preview/quote-preview.component';
import type { Service, QuoteItem, Quote } from '../../../core/models';

@Component({
  selector: 'app-quote-builder',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, QuotePreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="builder-header">
      <h2>Novo Orçamento</h2>
      <div class="actions">
        @if (savedQuote()) {
          <button (click)="downloadPdf()" class="btn-secondary">Descarregar PDF</button>
        }
        <button (click)="save()" [disabled]="saving() || items().length === 0" class="btn-primary">
          {{ saving() ? 'A guardar...' : 'Guardar rascunho' }}
        </button>
      </div>
    </div>

    <div class="meta-fields">
      <input [(ngModel)]="clientName" placeholder="Nome do cliente" />
      <input [(ngModel)]="clientEmail" type="email" placeholder="Email do cliente" />
      <textarea [(ngModel)]="notes" placeholder="Notas (opcional)"></textarea>
    </div>

    <div class="builder-panels">
      <!-- Left: service picker -->
      <div class="panel-services">
        <h3>Catálogo de Serviços</h3>
        @for (category of categories(); track category) {
          <div class="category">
            <h4>{{ category }}</h4>
            @for (s of servicesByCategory()[category]; track s.id) {
              <button class="service-chip" (click)="addService(s)">
                {{ s.name }} <span>{{ s.default_hours }}h</span>
              </button>
            }
          </div>
        }
      </div>

      <!-- Right: quote preview -->
      <div class="panel-preview">
        <div class="items-list">
          @for (item of items(); track item.service_id) {
            <div class="item-row">
              <span class="item-name">{{ item.name }}</span>
              <input type="number" [value]="item.hours" min="0" step="0.5"
                (change)="updateHours(item.service_id, +$any($event.target).value)" />
              <span class="item-sub">{{ item.subtotal | currency:'EUR':'symbol':'1.2-2':'pt' }}</span>
              <button (click)="removeItem(item.service_id)" class="remove">✕</button>
            </div>
          } @empty {
            <p class="empty">Clica num serviço para o adicionar.</p>
          }
        </div>

        <div class="rate-row">
          <label>Custo por hora</label>
          <input type="range" min="10" max="100" step="1"
            [value]="hourlyRate()" (input)="hourlyRate.set(+$any($event.target).value)" />
          <span class="rate-val">€{{ hourlyRate() }}/h</span>
        </div>

        <div class="totals-summary">
          <span>{{ totalHours() }}h no total</span>
          <span class="total-amount">{{ totalAmount() | currency:'EUR':'symbol':'1.2-2':'pt' }}</span>
        </div>
      </div>
    </div>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
  `,
  styles: [`
    .builder-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .actions { display: flex; gap: .5rem; }
    .meta-fields { display: flex; gap: .75rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .meta-fields input, .meta-fields textarea { padding: .5rem .75rem; border: 1px solid #e2e8f0; border-radius: 6px; flex: 1; min-width: 200px; }
    .builder-panels { display: grid; grid-template-columns: 280px 1fr; gap: 1rem; }
    .panel-services { background: white; border-radius: 8px; padding: 1rem; }
    .category { margin-bottom: 1rem; }
    h4 { font-size: .75rem; text-transform: uppercase; color: #64748b; margin-bottom: .5rem; }
    .service-chip { display: flex; justify-content: space-between; width: 100%; padding: .5rem .75rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; margin-bottom: .25rem; }
    .service-chip span { color: #94a3b8; font-size: .85rem; }
    .panel-preview { background: white; border-radius: 8px; padding: 1rem; }
    .item-row { display: flex; align-items: center; gap: .5rem; padding: .5rem 0; border-bottom: 1px solid #f1f5f9; }
    .item-name { flex: 1; }
    .item-row input { width: 60px; padding: .25rem; border: 1px solid #e2e8f0; border-radius: 4px; text-align: center; }
    .remove { border: none; background: none; color: #ef4444; cursor: pointer; }
    .rate-row { display: flex; align-items: center; gap: 1rem; margin: 1rem 0; }
    .rate-val { font-weight: 600; min-width: 60px; }
    .totals-summary { display: flex; justify-content: space-between; font-weight: 600; padding-top: .75rem; border-top: 2px solid #e2e8f0; }
    .total-amount { font-size: 1.25rem; color: #1e293b; }
    .empty { color: #94a3b8; text-align: center; padding: 2rem; }
    .btn-primary { background: #3b82f6; color: white; border: none; padding: .5rem 1rem; border-radius: 6px; cursor: pointer; }
    .btn-secondary { background: white; border: 1px solid #e2e8f0; padding: .5rem 1rem; border-radius: 6px; cursor: pointer; }
    .error { color: #ef4444; margin-top: 1rem; }
  `],
})
export class QuoteBuilderComponent implements OnInit {
  private quoteService = inject(QuoteService);
  private catalogueService = inject(ServiceCatalogueService);
  private settingsService = inject(SettingsService);
  private pdfService = inject(QuotePdfService);
  private router = inject(Router);

  clientName = '';
  clientEmail = '';
  notes = '';
  hourlyRate = signal(15);
  items = signal<QuoteItem[]>([]);
  saving = signal(false);
  error = signal('');
  savedQuote = signal<Quote | null>(null);

  categories = signal<string[]>([]);
  servicesByCategory = signal<Record<string, Service[]>>({});

  totalHours = computed(() => this.items().reduce((s, i) => s + i.hours, 0));
  totalAmount = computed(() => this.totalHours() * this.hourlyRate());

  async ngOnInit() {
    const [services, settings] = await Promise.all([
      this.catalogueService.getServices(),
      this.settingsService.getSettings(),
    ]);
    this.hourlyRate.set(settings.hourly_rate);
    const cats = [...new Set(services.filter(s => s.active).map(s => s.category))].sort();
    this.categories.set(cats);
    this.servicesByCategory.set(Object.fromEntries(cats.map(c => [c, services.filter(s => s.category === c && s.active)])));
  }

  addService(s: Service) {
    if (this.items().some(i => i.service_id === s.id)) return;
    const hours = s.default_hours;
    this.items.update(list => [...list, { service_id: s.id, name: s.name, hours, subtotal: hours * this.hourlyRate() }]);
  }

  updateHours(serviceId: string, hours: number) {
    this.items.update(list => list.map(i =>
      i.service_id === serviceId ? { ...i, hours, subtotal: hours * this.hourlyRate() } : i
    ));
  }

  removeItem(serviceId: string) {
    this.items.update(list => list.filter(i => i.service_id !== serviceId));
  }

  async save() {
    this.saving.set(true);
    this.error.set('');
    try {
      const quote = await this.quoteService.createQuote({
        client_name: this.clientName,
        client_email: this.clientEmail,
        hourly_rate: this.hourlyRate(),
        items: this.items().map(i => ({ ...i, subtotal: i.hours * this.hourlyRate() })),
        notes: this.notes,
      });
      this.savedQuote.set(quote);
      this.router.navigate(['/admin/quotes', quote.id]);
    } catch (e: any) {
      this.error.set(e.message ?? 'Erro ao guardar');
    } finally {
      this.saving.set(false);
    }
  }

  downloadPdf() {
    const q = this.savedQuote();
    if (q) this.pdfService.generatePdf(q);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add quote builder component with live price calculation"
```

---

## Task 12: Quote Detail + Convert to Invoice

**Files:**
- Create: `api/quotes/[id]/send.ts`
- Test: `api/quotes/[id]/send.test.ts`
- Create: `src/app/features/quotes/detail/quote-detail.component.ts`

- [ ] **Step 1: Write failing test for send endpoint (required by CLAUDE.md)**

```ts
// api/quotes/[id]/send.test.ts
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: jest.fn().mockResolvedValue({ id: 'email-id' }) },
  })),
}));
jest.mock('../../_lib/jwt', () => ({ verifyJwt: jest.fn().mockResolvedValue(true) }));
jest.mock('../../_lib/supabase', () => ({
  createAdminClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: {
        id: 'q1', number: 'ORC-2026-001', client_name: 'Test', client_email: 'c@test.pt',
        status: 'quote', hourly_rate: 15, items: [], notes: '', total_amount: 120,
      },
      error: null,
    }),
    update: jest.fn().mockReturnThis(),
  }),
}));

import handler from './send';

describe('POST /api/quotes/:id/send', () => {
  const makeReq = () => ({
    method: 'POST',
    headers: { authorization: 'Bearer valid-token' },
    query: { id: 'q1' },
  } as any);

  it('returns 200 and writes sent_at on success', async () => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), end: jest.fn() } as any;
    await handler(makeReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('returns 401 when JWT is invalid', async () => {
    const { verifyJwt } = require('../../_lib/jwt');
    verifyJwt.mockResolvedValueOnce(false);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), end: jest.fn() } as any;
    await handler(makeReq(), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 500 and does NOT write sent_at when email send fails', async () => {
    const { Resend } = require('resend');
    Resend.mockImplementationOnce(() => ({
      emails: { send: jest.fn().mockRejectedValue(new Error('Resend error')) },
    }));
    const supabase = require('../../_lib/supabase').createAdminClient();
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), end: jest.fn() } as any;
    await handler(makeReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(supabase.update).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test -- --testPathPattern="send\.test"
```

- [ ] **Step 3: Write serverless POST /api/quotes/:id/send**

```ts
// api/quotes/[id]/send.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import { verifyJwt } from '../../_lib/jwt';
import { createAdminClient } from '../../_lib/supabase';

const resend = new Resend(process.env['RESEND_API_KEY']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!await verifyJwt(req)) return res.status(401).json({ message: 'Não autorizado' });

  const { id } = req.query as { id: string };
  const supabase = createAdminClient();

  const { data: quote, error: fetchError } = await supabase.from('quotes').select('*').eq('id', id).single();
  if (fetchError || !quote) return res.status(404).json({ message: 'Orçamento não encontrado' });

  const { data: settings } = await supabase.from('settings').select('owner_email, vat_mode').single();
  const isInvoice = quote.status === 'invoice';
  const docType = isInvoice ? 'Fatura' : 'Orçamento';

  const itemsHtml = quote.items.map((i: any) =>
    `<tr><td>${i.name}</td><td>${i.hours}h</td><td>€${(i.hours * quote.hourly_rate).toFixed(2)}</td></tr>`
  ).join('');

  const vatLine = settings?.vat_mode === 'standard'
    ? `<tr><td colspan="2"><strong>IVA 23%</strong></td><td>€${(quote.total_amount * 0.23).toFixed(2)}</td></tr>
       <tr><td colspan="2"><strong>Total</strong></td><td><strong>€${(quote.total_amount * 1.23).toFixed(2)}</strong></td></tr>`
    : `<tr><td colspan="3" style="font-size:12px;color:#64748b">Isento nos termos do art.º 53.º do CIVA</td></tr>`;

  const html = `
    <h2>${docType} ${quote.number}</h2>
    <p>Exmo(a) ${quote.client_name},</p>
    <p>${isInvoice ? 'Segue em anexo a fatura relativa aos serviços prestados.' : 'Segue o orçamento solicitado.'}</p>
    <table border="1" cellpadding="8" style="border-collapse:collapse;width:100%">
      <thead><tr><th>Serviço</th><th>Horas</th><th>Subtotal</th></tr></thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot>${vatLine}</tfoot>
    </table>
    ${quote.notes ? `<p><em>Notas: ${quote.notes}</em></p>` : ''}
    <p>Com os melhores cumprimentos</p>
  `;

  const agencyName = settings?.agency_name ?? 'A Minha Agência Web';
  const senderEmail = settings?.sender_email ?? 'noreply@agencia.pt';

  const sends = [
    resend.emails.send({
      from: senderEmail,
      to: [quote.client_email],
      subject: `${docType} ${quote.number} — ${agencyName}`,
      html,
      text: `${docType} ${quote.number}\n\nCliente: ${quote.client_name}\nTotal: €${quote.total_amount}`,
    }),
  ];

  // Always send owner copy if email is configured — both must succeed per spec
  if (settings?.owner_email) {
    sends.push(
      resend.emails.send({
        from: senderEmail,
        to: [settings.owner_email],
        subject: `[Cópia] ${docType} ${quote.number} enviado para ${quote.client_email}`,
        html: `<p>Cópia enviada em ${new Date().toLocaleString('pt-PT')}.</p>${html}`,
        text: `Cópia enviada para ${quote.client_email}`,
      })
    );
  }

  try {
    // Only write sent_at AFTER all sends succeed (spec requirement)
    await Promise.all(sends);
  } catch {
    return res.status(500).json({ message: 'Falha ao enviar email — tente novamente' });
  }

  await supabase.from('quotes').update({ sent_at: new Date().toISOString() }).eq('id', id);
  return res.status(200).json({ success: true });
}
```

- [ ] **Step 2: Build Quote Detail Component**

```ts
// src/app/features/quotes/detail/quote-detail.component.ts
import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuoteService } from '../../../core/services/quote.service';
import { QuotePdfService } from '../../../core/services/quote-pdf.service';
import { SettingsService } from '../../../core/services/settings.service';
import { QuotePreviewComponent } from '../../../shared/components/quote-preview/quote-preview.component';
import { apiRequest } from '../../../core/utils/api-client';
import type { Quote, Settings } from '../../../core/models';

@Component({
  selector: 'app-quote-detail',
  standalone: true,
  imports: [QuotePreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (quote()) {
      <div class="detail-header">
        <div>
          <h2>{{ quote()!.number }}</h2>
          @if (quote()!.quote_number) {
            <p class="sub">Convertido de {{ quote()!.quote_number }}</p>
          }
        </div>
        <div class="actions">
          <button (click)="downloadPdf()" class="btn-secondary">Descarregar PDF</button>
          <button (click)="sendEmail()" [disabled]="sending()" class="btn-secondary">
            {{ sending() ? 'A enviar...' : quote()!.sent_at ? 'Reenviar por email' : 'Enviar por email' }}
          </button>
          @if (quote()!.status === 'quote') {
            <button (click)="convert()" [disabled]="converting()" class="btn-convert">
              {{ converting() ? 'A converter...' : 'Converter em Fatura' }}
            </button>
          }
        </div>
      </div>

      @if (sendSuccess()) {
        <p class="success">Email enviado com sucesso.</p>
      }
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      <div class="preview-wrap">
        <app-quote-preview [quote]="quote()!" [vatMode]="settings()?.vat_mode ?? 'exempt'" />
      </div>
    } @else {
      <p>A carregar...</p>
    }
  `,
  styles: [`
    .detail-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .sub { font-size: .85rem; color: #64748b; }
    .actions { display: flex; gap: .5rem; flex-wrap: wrap; }
    .preview-wrap { background: white; padding: 2rem; border-radius: 8px; max-width: 700px; }
    .btn-secondary { background: white; border: 1px solid #e2e8f0; padding: .5rem 1rem; border-radius: 6px; cursor: pointer; }
    .btn-convert { background: #16a34a; color: white; border: none; padding: .5rem 1rem; border-radius: 6px; cursor: pointer; }
    .success { color: #16a34a; margin-bottom: 1rem; }
    .error { color: #ef4444; margin-bottom: 1rem; }
  `],
})
export class QuoteDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private quoteService = inject(QuoteService);
  private pdfService = inject(QuotePdfService);
  private settingsService = inject(SettingsService);

  quote = signal<Quote | null>(null);
  settings = signal<Settings | null>(null);
  sending = signal(false);
  converting = signal(false);
  sendSuccess = signal(false);
  error = signal('');

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    const [quote, settings] = await Promise.all([
      this.quoteService.getQuote(id),
      this.settingsService.getSettings(),
    ]);
    this.quote.set(quote);
    this.settings.set(settings);
  }

  downloadPdf() {
    const q = this.quote();
    if (q) this.pdfService.generatePdf(q, this.settings()?.vat_mode ?? 'exempt');
  }

  async sendEmail() {
    const q = this.quote();
    if (!q) return;
    this.sending.set(true);
    this.sendSuccess.set(false);
    this.error.set('');
    try {
      await apiRequest(`/api/quotes/${q.id}/send`, { method: 'POST' });
      this.quote.update(current => current ? { ...current, sent_at: new Date().toISOString() } : null);
      this.sendSuccess.set(true);
    } catch (e: any) {
      this.error.set(e.message ?? 'Falha ao enviar — tente novamente');
    } finally {
      this.sending.set(false);
    }
  }

  async convert() {
    const q = this.quote();
    if (!q) return;
    if (!confirm('Converter este orçamento em fatura? Esta acção não pode ser revertida.')) return;
    this.converting.set(true);
    try {
      const updated = await this.quoteService.convertToInvoice(q.id);
      this.quote.set(updated);
    } catch (e: any) {
      this.error.set(e.message ?? 'Erro ao converter');
    } finally {
      this.converting.set(false);
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add quote detail, send email endpoint, and convert-to-invoice flow"
```

---

## Task 13: Health Endpoint + Final Wiring

**Files:**
- Create: `api/health.ts`
- Verify: all routes load correctly

- [ ] **Step 1: Write health endpoint**

```ts
// api/health.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

- [ ] **Step 2: Run all tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Build the Angular app**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 4: Smoke test locally**

```bash
vercel dev
```

Test the full flow:
1. `http://localhost:3000/login` — login page renders
2. Enter the correct password → redirects to `/admin/quotes`
3. Navigate to Settings — change hourly rate and save
4. Navigate to Services — add a new service
5. Navigate to Quotes → New — build a quote and save
6. Download PDF — file downloads
7. On quote detail — click "Converter em Fatura"
8. Send by email — confirm email arrives (check Resend dashboard)

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: add health endpoint and complete invoice tool implementation"
```

---

## Task 14: Deploy to Vercel

- [ ] **Step 1: Push to GitHub**

```bash
git remote add origin https://github.com/your-username/agencia-invoices.git
git push -u origin main
```

- [ ] **Step 2: Import project in Vercel**

Go to vercel.com → New Project → import the GitHub repo.

- [ ] **Step 3: Set all environment variables in Vercel dashboard**

```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ADMIN_PASSWORD
JWT_SECRET
RESEND_API_KEY
```

- [ ] **Step 4: Deploy**

```bash
vercel --prod
```

- [ ] **Step 5: Verify production**

- Login works with the production password
- Create a test quote, download PDF, send email
- Check `/api/health` returns `{ status: 'ok' }`

- [ ] **Step 6: Set up UptimeRobot**

Add monitor for `https://your-domain.vercel.app/api/health` — check every 5 minutes.

---

## Summary

| Task | What it builds |
|------|---------------|
| 1 | Project bootstrap — Angular, Jest, Vercel config |
| 2 | Supabase schema — 3 tables, RLS, seed data |
| 3 | Shared types, API client, server-side JWT/Supabase helpers |
| 4 | Auth — serverless login, AuthService, AuthGuard |
| 5 | App shell — routing, admin layout, login page |
| 6 | Settings page — hourly rate, VAT mode, owner email |
| 7 | Service catalogue — CRUD with inline form |
| 8 | Quote service + serverless create/update with number generation |
| 9 | Quotes list component |
| 10 | Quote preview component + jsPDF service |
| 11 | Quote builder — two-panel, live price calculation |
| 12 | Quote detail + email sending + convert to invoice |
| 13 | Health endpoint + smoke testing |
| 14 | Deploy to Vercel |
