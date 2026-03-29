import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { verifyJwt } from '../_lib/jwt.js';
import { createAdminClient } from '../_lib/supabase.js';

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

function clientInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 3) || 'ORC';
}

async function generateNumber(
  supabase: ReturnType<typeof import('../_lib/supabase').createAdminClient>,
  clientName: string
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = clientInitials(clientName);
  const { data } = await supabase
    .from('quotes')
    .select('number')
    .like('number', `${prefix}-${year}-%`)
    .order('number', { ascending: false })
    .limit(1);

  const lastNum = data?.[0]?.number;
  const seq = lastNum ? parseInt(lastNum.split('-')[2], 10) + 1 : 1;
  return `${prefix}-${year}-${String(seq).padStart(3, '0')}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!await verifyJwt(req)) return res.status(401).json({ message: 'Não autorizado' });

  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: 'Dados inválidos' });

  const supabase = createAdminClient();
  const number = await generateNumber(supabase, result.data.client_name);
  const { items, hourly_rate } = result.data;
  const total_hours = items.reduce((sum, i) => sum + i.hours, 0);
  const total_amount = total_hours * hourly_rate;

  const { data, error } = await supabase
    .from('quotes')
    .insert({ ...result.data, number, total_hours, total_amount })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'Número de documento já existe — tente novamente' });
    return res.status(500).json({ message: 'Erro ao criar orçamento' });
  }
  return res.status(201).json(data);
}
