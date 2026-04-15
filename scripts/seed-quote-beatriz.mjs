// Script: insere o orçamento ORC-2026-004 (Beatriz Borges) no Supabase
// Uso: node scripts/seed-quote-beatriz.mjs

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rguwiaxjapotlsvpvgpt.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJndXdpYXhqYXBvdGxzdnB2Z3B0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg2MTM1NiwiZXhwIjoyMDg5NDM3MzU2fQ.474kn_Zv9YOAqzhzjudJq9k3RKyaYx5hiH177FSGCcs';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const items = [
  { service_id: 'bb-01', name: 'Página inicial',                                                              hours: 8,  subtotal: 120 },
  { service_id: 'bb-02', name: 'Página sobre',                                                                hours: 4,  subtotal: 60  },
  { service_id: 'bb-03', name: 'Página de serviços — Profissionais',                                          hours: 3,  subtotal: 45  },
  { service_id: 'bb-04', name: 'Página de serviços — Organizações',                                          hours: 3,  subtotal: 45  },
  { service_id: 'bb-05', name: 'Secção de preçário / tabela de preços',                                      hours: 1,  subtotal: 15  },
  { service_id: 'bb-06', name: 'Página de contacto',                                                          hours: 2,  subtotal: 30  },
  { service_id: 'bb-07', name: 'Design responsivo — revisão todos os breakpoints',                            hours: 3,  subtotal: 45  },
  { service_id: 'bb-08', name: 'Formulário de contacto',                                                      hours: 3,  subtotal: 45  },
  { service_id: 'bb-09', name: 'Secção de FAQ (perguntas frequentes)',                                        hours: 2,  subtotal: 30  },
  { service_id: 'bb-10', name: 'Testemunhos',                                                                  hours: 2,  subtotal: 30  },
  { service_id: 'bb-11', name: 'Ecrã de entrada animado (splash screen)',                                     hours: 1,  subtotal: 15  },
  { service_id: 'bb-12', name: 'Cookie banner + Política de cookies + Termos e Condições',                   hours: 2,  subtotal: 30  },
  { service_id: 'bb-13', name: 'Suporte multilingue PT/EN',                                                   hours: 1,  subtotal: 15  },
  { service_id: 'bb-14', name: 'Schema.org LocalBusiness',                                                    hours: 2,  subtotal: 30  },
  { service_id: 'bb-15', name: 'SEO on-page avançado (palavras-chave, meta, headings)',                      hours: 4,  subtotal: 60  },
  { service_id: 'bb-16', name: 'Sitemap XML + robots.txt + Google Search Console',                            hours: 1,  subtotal: 15  },
  { service_id: 'bb-17', name: 'Open Graph e meta tags para redes sociais',                                   hours: 1,  subtotal: 15  },
  { service_id: 'bb-18', name: 'Deploy Vercel + DNS Cloudflare',                                              hours: 2,  subtotal: 30  },
  { service_id: 'bb-19', name: 'Sistema de agendamento online (UI + calendário interactivo + gestão de slots)', hours: 5, subtotal: 75  },
  { service_id: 'bb-20', name: 'Integração Google Calendar API (disponibilidade, reservas e emails automáticos de confirmação)', hours: 5, subtotal: 75 },
  { service_id: 'bb-21', name: 'Segurança da API e conformidade RGPD (validação de dados, protecção anti-spam, política de privacidade)', hours: 2, subtotal: 30 },
  { service_id: 'bb-22', name: 'Desconto inaugural (1.º projecto + portfólio)',                               hours: 0,  subtotal: -55 },
];

const total_hours = items.filter(i => i.hours > 0).reduce((s, i) => s + i.hours, 0); // 57
const total_amount = 800;

const { data, error } = await supabase
  .from('quotes')
  .update({
    client_name: 'Beatriz Borges',
    client_email: 'beatriz.borges@the-t-lab.com',
    status: 'quote',
    hourly_rate: 15,
    items,
    notes: 'Isento de IVA — art.º 53.º do CIVA\nCondições de pagamento: pagamento na entrega do projecto.',
    total_hours,
    total_amount,
  })
  .eq('number', 'ORC-2026-004')
  .select()
  .single();

if (error) {
  console.error('Erro:', error.message);
  process.exit(1);
}

console.log('Orçamento criado com sucesso!');
console.log(`  ID:     ${data.id}`);
console.log(`  Número: ${data.number}`);
console.log(`  Total:  €${data.total_amount}`);
