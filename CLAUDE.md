# CLAUDE.md

> Instruções para Claude Code — lido automaticamente em cada sessão.
> Perfil: Websites institucionais para negócios locais (advogados, clínicas, lojas, restaurantes, etc.)
> Stack: Angular v21 · Node.js · Supabase · Vercel · GitHub · Stripe · Clerk · Cloudflare · Sentry · Resend

## Skills activos neste projecto

- **ui-ux-pro-max** — usar sempre que houver decisões de UI/UX (layouts, componentes visuais, paletes de cor, tipografia)

---

## Contexto do negócio

Desenvolvemos websites profissionais para pequenas e médias empresas portuguesas.
Prioridades por ordem:
1. **Velocidade de entrega** — reutilizar componentes e padrões já testados
2. **Performance** — boas Core Web Vitals (impacto directo no SEO local)
3. **Manutenibilidade** — código simples que qualquer dev consegue continuar
4. **Escalabilidade** — só quando justificado

---

## Comportamento geral

- Lê sempre este ficheiro antes de qualquer acção
- Usa `sequential-thinking` para arquitectura e quando há múltiplas abordagens
- Usa `context7` sempre que trabalhas com bibliotecas externas — nunca assumas versões
- Prefere soluções simples a soluções "elegantes" mas complexas
- Antes de criar um componente novo, verifica se já existe um reutilizável
- Commits pequenos e frequentes — Conventional Commits em inglês
- Nunca apagues código sem confirmar

---

## Stack tecnológico

### Frontend — Angular v21
```
use library /angular/angular
```

**Padrões obrigatórios:**
- **Standalone Components** sempre (sem NgModules)
- **Signals** para estado reactivo (`signal()`, `computed()`, `effect()`)
- **inject()** em vez de constructor injection
- `OnPush` change detection em todos os componentes
- Lazy loading em rotas não-críticas (qualquer página que não seja a home)
- TypeScript com `strict: true` — nunca uses `any`

**Estrutura de pastas (por projecto de cliente):**
```
src/
  app/
    core/
      services/      # serviços singleton (analytics, seo, contact)
      guards/        # auth guards se necessário
    shared/
      components/    # componentes reutilizáveis entre projectos
        hero/
        navbar/
        footer/
        contact-form/
        cta-section/
        testimonials/
        pricing-card/
        gallery/
      pipes/
      utils/
    features/        # secções específicas de cada cliente
      home/
      about/
      services/
      contact/
      blog/          # se tiver CMS
    layout/
```

**Componentes partilhados prioritários** (biblioteca reutilizável entre clientes):
- `HeroComponent` — hero section com variantes (centrado, com imagem, com vídeo)
- `ContactFormComponent` — formulário com validação + envio via Resend
- `NavbarComponent` — menu responsivo com variantes
- `FooterComponent` — com morada, horário, links sociais
- `TestimonialsComponent` — carrossel ou grid
- `CtaSectionComponent` — call-to-action configurável via @Input
- `GalleryComponent` — galeria com lightbox
- `BusinessHoursComponent` — horário de funcionamento
- `MapEmbedComponent` — Google Maps embed

**Sintaxe de templates — usar SEMPRE a sintaxe nova (Angular v17+):**

```html
<!-- ✅ CORRECTO — sintaxe nova -->
@if (user()) {
  <p>Olá, {{ user().name }}</p>
} @else {
  <p>Por favor faz login</p>
}

@for (item of items(); track item.id) {
  <li>{{ item.name }}</li>
} @empty {
  <li>Sem resultados</li>
}

@switch (status()) {
  @case ('active')   { <span class="active">Activo</span> }
  @case ('inactive') { <span class="inactive">Inactivo</span> }
  @default           { <span>Desconhecido</span> }
}

@defer (on viewport) {
  <app-heavy-component />
} @placeholder {
  <div>A carregar...</div>
}
```

```html
<!-- ❌ PROIBIDO — sintaxe antiga, nunca usar -->
<p *ngIf="user">...</p>
<li *ngFor="let item of items">...</li>
<ng-container [ngSwitch]="status">...</ng-container>
```

Nota: `@for` requer sempre `track` — usar `track item.id` ou `track $index` se não houver id.

**SEO — crítico para negócios locais:**
```typescript
// Usar Angular Meta e Title services em cada página
// Schema.org LocalBusiness markup
// Open Graph para partilha em redes sociais
// Sitemap automático
```

### Testes — Jest + Angular Testing Library
```
use library /angular/angular
```
Usamos **Jest** (mais rápido que Karma, sem browser necessário, melhor DX).

**O que testar obrigatoriamente:**
- Formulário de contacto (validação + submissão)
- Lógica de envio de email
- Webhooks Stripe (se o projecto tiver pagamentos)
- Guards de autenticação

**O que não perder tempo a testar:**
- Componentes puramente visuais sem lógica
- Páginas estáticas sem interacção

```bash
# Configurar Jest num projecto Angular
npm install -D jest @types/jest jest-preset-angular @testing-library/angular
```

### Node.js (Backend / API)
- Para projectos simples: **Vercel Serverless Functions** (sem servidor separado)
- Para projectos complexos: Express/Fastify com deploy independente
- TypeScript com `strict: true`
- Validação de inputs com **Zod**

**Endpoints típicos para sites de negócios locais:**
```
POST /api/contact     → recebe formulário, envia email via Resend
POST /api/newsletter  → subscrição newsletter
POST /webhooks/stripe → pagamentos (se aplicável)
GET  /api/health      → para monitorização UptimeRobot
```

---

## Serviços externos

### Supabase (só quando necessário)
```
use library /supabase/supabase
```
**Usar quando:** formulários com histórico, blog/CMS simples, agendamentos.
**Não usar quando:** site puramente estático — não adicionar complexidade desnecessária.

- RLS activo em **todas** as tabelas, sempre
- Nunca expões a service role key no cliente
- Usa `supabase.auth.getUser()` no servidor para validar sessões

### Clerk (Auth — só quando necessário)
```
use library /clerk/javascript
```
**Usar quando:** área de cliente, portal de agendamentos, conteúdo restrito.
**Não usar quando:** site institucional simples — não criar fricção desnecessária.

### Stripe (Pagamentos)
```
use library /stripe/stripe-node
```
**Métodos relevantes para Portugal:**
- **MBway** — activar no Stripe Dashboard → Payment Methods (45%+ dos pagamentos online em PT)
- **Multibanco** — voucher via ATM, muito usado por clientes menos tech-savvy
- **Cartão** — Visa/Mastercard padrão

**Casos de uso comuns:**
- Marcações/reservas pagas
- Serviços ou cursos online
- Lojas simples (para e-commerce a sério, considerar Shopify)

```typescript
// Validar webhook — sempre obrigatório
const event = stripe.webhooks.constructEvent(
  req.rawBody,
  req.headers['stripe-signature'],
  process.env.STRIPE_WEBHOOK_SECRET
);
```

### Resend (Email)
```
use library /resend/resend
```
**Fluxos típicos:**
- Confirmação de formulário de contacto (para o visitante + para o negócio)
- Confirmação de marcação
- Recibo de pagamento

```typescript
// Template básico — sempre incluir versão texto simples
await resend.emails.send({
  from: 'noreply@dominio-do-cliente.pt',
  to: ['email@negocio.pt'],
  subject: 'Nova mensagem de contacto',
  html: emailTemplate({ nome, email, mensagem }),
  text: `Nome: ${nome}\nEmail: ${email}\nMensagem: ${mensagem}`,
});
```

- Verificar sempre o domínio do cliente antes do go-live
- Usar subdomínio para envio: `mail.dominio-do-cliente.pt`

### Sentry (Error Tracking)
- Instalar em todos os projectos, mesmo nos simples
- Nunca enviar PII ao Sentry — filtrar com `beforeSend`
- Configurar alertas por email para erros novos em produção

### Vercel (Deploy)
- Um projecto Vercel por cliente
- Preview deployments automáticos em cada PR — mostrar ao cliente antes de publicar
- Variáveis de ambiente no dashboard da Vercel, nunca no código
- Domínio do cliente configurado via Cloudflare

### Cloudflare (DNS)
- DNS de todos os clientes gerido aqui
- Para Vercel: CNAME com proxy **desactivado** (nuvem cinzenta)
- Activar protecção básica contra bots e DDoS
- Cache de assets estáticos activado

---

## SEO Local (prioritário para este tipo de projectos)

```typescript
// Schema.org LocalBusiness — incluir em todos os sites
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness", // ou "LegalService", "MedicalBusiness", "Restaurant", etc.
  "name": "Nome do Negócio",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Rua Exemplo, 123",
    "addressLocality": "Figueira da Foz",
    "postalCode": "3080-000",
    "addressCountry": "PT"
  },
  "telephone": "+351 233 000 000",
  "openingHours": ["Mo-Fr 09:00-18:00", "Sa 09:00-13:00"],
  "url": "https://www.exemplo.pt"
};
```

**Checklist SEO antes de go-live:**
- [ ] Title e meta description únicos em cada página
- [ ] Schema.org LocalBusiness implementado
- [ ] Open Graph tags para partilha social
- [ ] Sitemap.xml gerado e submetido no Google Search Console
- [ ] robots.txt configurado
- [ ] Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms
- [ ] Imagens optimizadas (WebP, lazy loading, dimensões correctas)
- [ ] Google My Business linkado ao site

---

## Performance (Core Web Vitals)

- Imagens: `loading="lazy"` em tudo excepto above-the-fold; usar WebP
- Fontes: `font-display: swap`; preconnect ou hospedar localmente
- Scripts de terceiros: carregar com `defer` ou `async`
- Angular: `OnPush` + lazy loading = diferença enorme em sites de conteúdo
- Alvo Lighthouse: 90+ em todas as categorias

---

## Git & Workflow

```bash
# Conventional Commits
feat: adiciona formulário de contacto com validação
fix: corrige layout mobile no hero
chore: actualiza dependências
content: actualiza textos da página de serviços
style: ajusta cores ao branding do cliente
seo: adiciona schema.org e meta tags
```

- Branch `main` → produção
- Branch `develop` → staging / preview
- Feature branches: `feat/nome-da-feature`
- Nunca push directo para `main`
- Nunca commites `.env` ou secrets

---

## Segurança

- Todas as chaves em variáveis de ambiente — nunca no código
- `.env` sempre no `.gitignore` — verificar no primeiro commit
- Rate limiting nos endpoints de contacto (evitar spam)
- Validar e sanitizar todos os inputs de formulários
- HTTPS garantido pela Vercel + Cloudflare
- Nunca expões stack traces ao utilizador final

---

## Checklist de novo projecto

```bash
# 1. Criar repo GitHub (nome: cliente-nome-website)
# 2. Inicializar Angular
ng new nome-cliente --standalone --strict

# 3. Dependências base
npm install resend zod
npm install @sentry/angular
npm install -D jest @types/jest jest-preset-angular @testing-library/angular

# 4. Criar projecto no Vercel e ligar ao repo
# 5. Configurar DNS no Cloudflare
# 6. Verificar domínio no Resend
# 7. Criar .env.example com todas as variáveis

# Supabase (apenas se necessário)
npm install @supabase/supabase-js
```

---

## Checklist de go-live

- [ ] Domínio configurado no Cloudflare + Vercel
- [ ] Todas as variáveis de ambiente em produção no Vercel
- [ ] Domínio de email verificado no Resend
- [ ] Formulário de contacto testado (email real recebido)
- [ ] MBway e Multibanco activados no Stripe (se aplicável)
- [ ] Sentry a capturar erros
- [ ] UptimeRobot a monitorizar homepage + /api/health
- [ ] Google Search Console configurado com sitemap
- [ ] Lighthouse: 90+ em todas as categorias
- [ ] Teste em mobile (iOS Safari + Android Chrome)
- [ ] Teste nos browsers principais (Chrome, Safari, Firefox)
- [ ] Schema.org validado em schema.org/SchemaApp ou Google Rich Results Test

---

## Comandos úteis

```bash
# Angular
ng generate component shared/components/nome --standalone
ng generate service core/services/nome

# Vercel
vercel dev        # desenvolvimento local com edge functions
vercel --prod     # deploy manual para produção

# Supabase (se usado)
supabase start
supabase gen types typescript --local

# Testes
npm run test
npm run test:watch
npm run test:coverage

# MCPs activos
/mcp
/context          # uso de contexto actual
/cost             # custo da sessão
```

---

## Context7 — bibliotecas mais usadas

```
use library /angular/angular
use library /supabase/supabase
use library /stripe/stripe-node
use library /resend/resend
use library /colinhacks/zod
```

---

*Actualizado: Março 2026 — Perfil: Websites institucionais para negócios locais em Portugal*
