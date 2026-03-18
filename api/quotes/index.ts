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

async function generateNumber(
  supabase: ReturnType<typeof import('../_lib/supabase').createAdminClient>,
  prefix: 'ORC' | 'FAT'
): Promise<string> {
  const year = new Date().getFullYear();
  const { data } = await supabase
    .from('quotes')
    .select('number')
    .like('number', `${prefix}-${year}-%`)
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
