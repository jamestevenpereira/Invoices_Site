-- Additional services catalogue
-- Covers: dentistas, advogados, floristas, restaurantes, clínicas,
--         imobiliárias, salões, contabilistas, veterinários, boutiques, etc.

-- Add unique constraint so ON CONFLICT works (idempotent migration)
ALTER TABLE services ADD CONSTRAINT services_name_unique UNIQUE (name);

INSERT INTO services (name, category, default_hours, active) VALUES

  -- ─── Design ─────────────────────────────────────────────────────────
  ('Página de serviços com listagem detalhada', 'Design', 6,  true),
  ('Página de equipa / profissionais',          'Design', 5,  true),
  ('Secção de preçário / tabela de preços',     'Design', 4,  true),
  ('Identidade visual — logótipo e paleta',     'Design', 10, true),
  ('Mockups e protótipo interactivo (Figma)',   'Design', 12, true),
  ('Animações e micro-interacções',             'Design', 6,  true),
  ('Design responsivo — revisão todos os breakpoints', 'Design', 6, true),
  ('Página de galeria / portfólio',             'Design', 4,  true),
  ('Landing page de campanha / promoção',       'Design', 5,  true),
  ('Página 404 personalizada',                  'Design', 1,  true),

  -- ─── Desenvolvimento ────────────────────────────────────────────────
  ('Botão flutuante WhatsApp',                              'Desenvolvimento', 2,  true),
  ('Widget de horário de funcionamento',                    'Desenvolvimento', 3,  true),
  ('Sistema de agendamento online (Calendly / Timify)',     'Desenvolvimento', 6,  true),
  ('Blog / área de artigos e notícias',                     'Desenvolvimento', 8,  true),
  ('Integração de feed Instagram / redes sociais',          'Desenvolvimento', 4,  true),
  ('Chat ao vivo (Crisp / tawk.to)',                        'Desenvolvimento', 4,  true),
  ('Pop-up de promoções configurável',                      'Desenvolvimento', 4,  true),
  ('Formulário de candidatura / recrutamento',              'Desenvolvimento', 5,  true),
  ('Área de cliente com autenticação',                      'Desenvolvimento', 16, true),
  ('Catálogo de produtos / serviços (sem checkout)',        'Desenvolvimento', 8,  true),
  ('Filtros e pesquisa de produtos / serviços',             'Desenvolvimento', 8,  true),
  ('Loja online — catálogo + carrinho + checkout',          'Desenvolvimento', 40, true),
  ('Integração de pagamentos Stripe (MB Way + Multibanco)', 'Desenvolvimento', 8,  true),
  ('Calculadora de orçamento online',                       'Desenvolvimento', 10, true),
  ('Menu digital interactivo (restaurante / café)',         'Desenvolvimento', 10, true),
  ('Sistema de reservas de mesa online',                    'Desenvolvimento', 8,  true),
  ('Página de ementa actualizável pelo cliente',            'Desenvolvimento', 5,  true),
  ('Integração plataformas delivery (Uber Eats / Glovo)',   'Desenvolvimento', 3,  true),
  ('Listagem de imóveis com filtros (imobiliária)',         'Desenvolvimento', 20, true),
  ('Página de imóvel — galeria, mapa, ficha técnica',      'Desenvolvimento', 8,  true),
  ('Formulário de pedido de visita / avaliação',            'Desenvolvimento', 4,  true),
  ('Página de vale-oferta / oferta especial',               'Desenvolvimento', 6,  true),
  ('Painel de administração CMS para o cliente',            'Desenvolvimento', 12, true),
  ('Acessibilidade WCAG 2.1 AA (obrigatório EAA 2025)',    'Desenvolvimento', 8,  true),
  ('Botões de partilha social',                             'Desenvolvimento', 2,  true),
  ('Emissão de facturas electrónicas (InvoiceXpress)',      'Desenvolvimento', 8,  true),
  ('Carrossel / slider de imagens',                         'Desenvolvimento', 2,  true),
  ('Secção de FAQ (perguntas frequentes)',                   'Desenvolvimento', 3,  true),

  -- ─── SEO ────────────────────────────────────────────────────────────
  ('SEO on-page avançado (palavras-chave, meta, headings)',    'SEO', 8, true),
  ('Sitemap XML + robots.txt + Google Search Console',         'SEO', 2, true),
  ('Open Graph e meta tags para redes sociais',               'SEO', 2, true),
  ('Auditoria e optimização Core Web Vitals',                 'SEO', 6, true),
  ('Ligação e optimização Google Business Profile',           'SEO', 3, true),
  ('Schema.org MedicalBusiness (clínicas / dentistas)',       'SEO', 2, true),
  ('Schema.org LegalService (advogados / solicitadores)',     'SEO', 2, true),
  ('Schema.org Restaurant (restaurantes / cafés)',            'SEO', 2, true),
  ('Redirects 301 e gestão de erros 404',                    'SEO', 2, true),
  ('Relatório mensal SEO e analytics',                       'SEO', 3, true),
  ('Optimização de imagens WebP + alt text SEO',             'SEO', 2, true),

  -- ─── Marketing ──────────────────────────────────────────────────────
  ('Integração Google Analytics 4 + Tag Manager',            'Marketing', 3, true),
  ('Pixel Meta (Facebook / Instagram) + conversões',         'Marketing', 4, true),
  ('Integração Google Ads — remarketing + conversões',       'Marketing', 3, true),
  ('Newsletter — subscrição + integração Resend / Brevo',   'Marketing', 4, true),
  ('Widget avaliações Google (Google Reviews embed)',        'Marketing', 3, true),
  ('Heatmaps e gravação de sessões (Hotjar / Clarity)',      'Marketing', 2, true),

  -- ─── Conteúdo ───────────────────────────────────────────────────────
  ('Copywriting em português — até 5 páginas',       'Conteúdo', 10, true),
  ('Versão bilingue do site PT + EN',                'Conteúdo', 12, true),
  ('Tratamento e optimização de fotografias',        'Conteúdo', 4,  true),
  ('Embed e optimização de vídeo hero / apresentação', 'Conteúdo', 3, true),
  ('Política de privacidade e termos de utilização', 'Conteúdo', 3,  true),
  ('Redacção de artigos de blog (por artigo)',       'Conteúdo', 3,  true),

  -- ─── Infraestrutura ─────────────────────────────────────────────────
  ('Banner de cookies e conformidade RGPD',                  'Infraestrutura', 4, true),
  ('Configuração de domínio e certificado SSL',              'Infraestrutura', 2, true),
  ('Email profissional (Google Workspace / Microsoft 365)',  'Infraestrutura', 2, true),
  ('Monitorização de uptime (UptimeRobot)',                  'Infraestrutura', 1, true),
  ('Rastreio de erros em produção (Sentry)',                 'Infraestrutura', 2, true),
  ('Backups automáticos e plano de recuperação',             'Infraestrutura', 2, true),
  ('Manutenção mensal (actualizações + suporte + conteúdos)','Infraestrutura', 4, true)

ON CONFLICT (name) DO NOTHING;
