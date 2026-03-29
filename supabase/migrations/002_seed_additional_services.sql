-- Additional services catalogue
-- Covers: dentistas, advogados, floristas, restaurantes, clínicas,
--         imobiliárias, salões, contabilistas, veterinários, boutiques, etc.
--
-- Horas calibradas para developer que conhece bem o stack (Angular + Supabase + Vercel)
-- com componentes reutilizáveis entre projectos. Tempo real de implementação,
-- sem buffer de vendas.

-- Add unique constraint so ON CONFLICT works (idempotent migration)
ALTER TABLE services ADD CONSTRAINT services_name_unique UNIQUE (name);

INSERT INTO services (name, category, default_hours, active) VALUES

  -- ─── Design ─────────────────────────────────────────────────────────
  -- Páginas adicionais com template já definido são rápidas
  ('Página de serviços com listagem detalhada', 'Design', 3,  true),
  -- Cards de equipa: foto + nome + bio + variante responsiva
  ('Página de equipa / profissionais',          'Design', 2,  true),
  -- Tabela de preços ou cards: 2-3 colunas com CTAs
  ('Secção de preçário / tabela de preços',     'Design', 2,  true),
  -- Logo vectorial + paleta + tipografia documentada no Figma
  ('Identidade visual — logótipo e paleta',     'Design', 8,  true),
  -- Wireframes + protótipo high-fidelity de 5-7 páginas no Figma
  ('Mockups e protótipo interactivo (Figma)',   'Design', 8,  true),
  -- Scroll animations, hover states — com uma lib (AOS / GSAP básico)
  ('Animações e micro-interacções',             'Design', 4,  true),
  -- QA responsivo em 4 breakpoints (móvel, tablet, desktop, wide)
  ('Design responsivo — revisão todos os breakpoints', 'Design', 3, true),
  -- Grid de imagens com lightbox (componente reutilizável)
  ('Página de galeria / portfólio',             'Design', 2,  true),
  -- Landing com hero + CTA + social proof + formulário
  ('Landing page de campanha / promoção',       'Design', 3,  true),
  -- Estilo + redireccionamento: literalmente 30-60 min
  ('Página 404 personalizada',                  'Design', 1,  true),

  -- ─── Desenvolvimento ────────────────────────────────────────────────
  -- Link + CSS + ícone SVG. Rápido.
  ('Botão flutuante WhatsApp',                              'Desenvolvimento', 1,  true),
  -- Componente com JSON de horários, lógica "aberto/fechado agora"
  ('Widget de horário de funcionamento',                    'Desenvolvimento', 2,  true),
  -- Embed de Calendly / Timify via iframe ou SDK: não é desenvolvimento custom
  ('Sistema de agendamento online (Calendly / Timify)',     'Desenvolvimento', 2,  true),
  -- Lista de artigos + página de detalhe + Supabase como CMS
  ('Blog / área de artigos e notícias',                     'Desenvolvimento', 6,  true),
  -- Widget embed (Elfsight ou API básica). API oficial do Instagram é restrita.
  ('Integração de feed Instagram / redes sociais',          'Desenvolvimento', 2,  true),
  -- Script embed + configuração da conta (Crisp/tawk.to)
  ('Chat ao vivo (Crisp / tawk.to)',                        'Desenvolvimento', 1,  true),
  -- Modal com cookie + lógica de mostrar 1x por sessão
  ('Pop-up de promoções configurável',                      'Desenvolvimento', 2,  true),
  -- Formulário multi-campo + upload de CV + email de notificação
  ('Formulário de candidatura / recrutamento',              'Desenvolvimento', 3,  true),
  -- Clerk ou Supabase Auth: login + sessão + guard de rotas + página protegida
  ('Área de cliente com autenticação',                      'Desenvolvimento', 10, true),
  -- Lista de produtos/serviços com Supabase + filtro por categoria
  ('Catálogo de produtos / serviços (sem checkout)',        'Desenvolvimento', 4,  true),
  -- Filtros client-side ou query Supabase + UI de filtros
  ('Filtros e pesquisa de produtos / serviços',             'Desenvolvimento', 4,  true),
  -- Produtos + carrinho (signal) + Stripe Checkout session — sem gestão de stock
  ('Loja online — catálogo + carrinho + checkout',          'Desenvolvimento', 24, true),
  -- Stripe checkout session + webhook + MB Way + Multibanco como payment methods
  ('Integração de pagamentos Stripe (MB Way + Multibanco)', 'Desenvolvimento', 5,  true),
  -- Formulário com campos configuráveis, cálculo em tempo real, resultado por email
  ('Calculadora de orçamento online',                       'Desenvolvimento', 5,  true),
  -- Categorias + items + fotos + Supabase. Sem checkout.
  ('Menu digital interactivo (restaurante / café)',         'Desenvolvimento', 5,  true),
  -- Date picker + disponibilidade + confirmação por email (Resend)
  ('Sistema de reservas de mesa online',                    'Desenvolvimento', 6,  true),
  -- Página editável via Supabase (CRUD simples para o dono)
  ('Página de ementa actualizável pelo cliente',            'Desenvolvimento', 3,  true),
  -- Só botões/links para as apps. Não existe API pública de integração real.
  ('Integração plataformas delivery (Uber Eats / Glovo)',   'Desenvolvimento', 1,  true),
  -- Schema Supabase + lista com filtros + rotas de detalhe + mapa
  ('Listagem de imóveis com filtros (imobiliária)',         'Desenvolvimento', 16, true),
  -- Template de detalhe: galeria, Google Maps, ficha técnica, formulário de contacto
  ('Página de imóvel — galeria, mapa, ficha técnica',      'Desenvolvimento', 4,  true),
  -- Formulário de contacto especializado (data preferida, tipo de visita)
  ('Formulário de pedido de visita / avaliação',            'Desenvolvimento', 2,  true),
  -- Página estática com design diferenciado + link para pagamento (Stripe link)
  ('Página de vale-oferta / oferta especial',               'Desenvolvimento', 3,  true),
  -- CRUD de conteúdos (artigos, serviços, etc.) com Supabase + auth
  ('Painel de administração CMS para o cliente',            'Desenvolvimento', 10, true),
  -- Auditoria com ferramentas (Lighthouse, axe) + correcções (contrast, ARIA, keyboard nav)
  ('Acessibilidade WCAG 2.1 AA (obrigatório EAA 2025)',    'Desenvolvimento', 6,  true),
  -- Componente com links nativos de partilha (Web Share API + fallbacks)
  ('Botões de partilha social',                             'Desenvolvimento', 1,  true),
  -- Integração REST InvoiceXpress: emitir fatura após pagamento Stripe
  ('Emissão de facturas electrónicas (InvoiceXpress)',      'Desenvolvimento', 6,  true),
  -- Swiper.js ou equivalent: carousel responsivo com autoplay + acessibilidade
  ('Carrossel / slider de imagens',                         'Desenvolvimento', 1,  true),
  -- Accordion com perguntas/respostas + schema FAQ para SEO
  ('Secção de FAQ (perguntas frequentes)',                   'Desenvolvimento', 2,  true),

  -- ─── SEO ────────────────────────────────────────────────────────────
  -- Pesquisa de KWs + meta title/description únicos + heading hierarchy em todas as páginas
  ('SEO on-page avançado (palavras-chave, meta, headings)',    'SEO', 5, true),
  -- Geração automática de sitemap + robots.txt + submissão no Search Console
  ('Sitemap XML + robots.txt + Google Search Console',         'SEO', 1, true),
  -- og:title, og:description, og:image em todas as páginas + teste no debugger
  ('Open Graph e meta tags para redes sociais',               'SEO', 1, true),
  -- Lighthouse audit + identificar e corrigir problemas LCP / CLS / INP
  ('Auditoria e optimização Core Web Vitals',                 'SEO', 4, true),
  -- Verificar/reclamar perfil + preencher toda a info + ligar ao site
  ('Ligação e optimização Google Business Profile',           'SEO', 2, true),
  -- JSON-LD com campos obrigatórios para clínicas médicas
  ('Schema.org MedicalBusiness (clínicas / dentistas)',       'SEO', 1, true),
  -- JSON-LD com campos de LegalService (especialidade, área geográfica)
  ('Schema.org LegalService (advogados / solicitadores)',     'SEO', 1, true),
  -- JSON-LD com Menu, openingHours, hasMenu para restaurantes
  ('Schema.org Restaurant (restaurantes / cafés)',            'SEO', 1, true),
  -- Vercel rewrites + páginas 404 personalizadas no Angular Router
  ('Redirects 301 e gestão de erros 404',                    'SEO', 1, true),
  -- Template de relatório mensal (GA4 + Search Console). Por mês.
  ('Relatório mensal SEO e analytics',                       'SEO', 2, true),
  -- Converter imagens para WebP + compressão + alt text descritivo
  ('Optimização de imagens WebP + alt text SEO',             'SEO', 2, true),

  -- ─── Marketing ──────────────────────────────────────────────────────
  -- Conta GA4 + GTM + eventos básicos (form submit, CTA click)
  ('Integração Google Analytics 4 + Tag Manager',            'Marketing', 2, true),
  -- Pixel + eventos standard (PageView, Lead, Contact) via GTM
  ('Pixel Meta (Facebook / Instagram) + conversões',         'Marketing', 2, true),
  -- Tag de remarketing + evento de conversão no checkout/contacto
  ('Integração Google Ads — remarketing + conversões',       'Marketing', 2, true),
  -- Formulário + double opt-in + integração Resend/Brevo + email de confirmação
  ('Newsletter — subscrição + integração Resend / Brevo',   'Marketing', 3, true),
  -- Google Places API ou widget embed com as avaliações reais
  ('Widget avaliações Google (Google Reviews embed)',        'Marketing', 1, true),
  -- Script embed Hotjar ou Clarity + verificação que grava bem
  ('Heatmaps e gravação de sessões (Hotjar / Clarity)',      'Marketing', 1, true),

  -- ─── Conteúdo ───────────────────────────────────────────────────────
  -- Escrever textos reais (não placeholder): ~2h/página para conteúdo profissional
  ('Copywriting em português — até 5 páginas',       'Conteúdo', 8,  true),
  -- Setup i18n no Angular + tradução de 5 páginas (PT→EN)
  ('Versão bilingue do site PT + EN',                'Conteúdo', 8,  true),
  -- Resize, compressão WebP, renomear com KW, export para /assets
  ('Tratamento e optimização de fotografias',        'Conteúdo', 2,  true),
  -- Embed YouTube/Vimeo em hero + lazy load + poster de fallback
  ('Embed e optimização de vídeo hero / apresentação', 'Conteúdo', 1, true),
  -- Adaptar template RGPD ao cliente + publicar (não é redacção jurídica)
  ('Política de privacidade e termos de utilização', 'Conteúdo', 2,  true),
  -- ~800-1000 palavras com pesquisa básica de KW. Por artigo.
  ('Redacção de artigos de blog (por artigo)',       'Conteúdo', 2,  true),

  -- ─── Infraestrutura ─────────────────────────────────────────────────
  -- Componente Angular com preferência de cookie + bloqueio de scripts terceiros
  ('Banner de cookies e conformidade RGPD',                  'Infraestrutura', 2, true),
  -- Cloudflare CNAME + Vercel custom domain + confirmar SSL activo
  ('Configuração de domínio e certificado SSL',              'Infraestrutura', 1, true),
  -- Setup Google Workspace + MX records no Cloudflare + teste de envio
  ('Email profissional (Google Workspace / Microsoft 365)',  'Infraestrutura', 1, true),
  -- Criar conta + adicionar URL + configurar alertas de email/SMS
  ('Monitorização de uptime (UptimeRobot)',                  'Infraestrutura', 1, true),
  -- DSN Sentry no Angular + filtrar PII com beforeSend + testar um erro
  ('Rastreio de erros em produção (Sentry)',                 'Infraestrutura', 1, true),
  -- Verificar backups Supabase + documentar processo de restore para o cliente
  ('Backups automáticos e plano de recuperação',             'Infraestrutura', 1, true),
  -- Por mês: actualizações de dependências + deploy + pequenas edições de conteúdo
  ('Manutenção mensal (actualizações + suporte + conteúdos)','Infraestrutura', 3, true)

ON CONFLICT (name) DO NOTHING;
