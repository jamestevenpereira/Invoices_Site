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
  client_nif: z.string().default(''),
  hourly_rate: z.number().min(1),
  items: z.array(itemSchema).min(1),
  notes: z.string().default(''),
  payment_terms: z.string().default(''),
  valid_until: z.string().nullable().default(null),
});

async function generateNumber(
  supabase: ReturnType<typeof import('../_lib/supabase').createAdminClient>,
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ORC/${year}/`;
  const { data } = await supabase
    .from('quotes')
    .select('number')
    .like('number', `${prefix}%`)
    .order('number', { ascending: false })
    .limit(1);

  const lastNum = data?.[0]?.number as string | undefined;
  const seq = lastNum ? parseInt(lastNum.split('/')[2], 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(3, '0')}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!await verifyJwt(req)) return res.status(401).json({ message: 'Não autorizado' });

  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: 'Dados inválidos' });

  const supabase = createAdminClient();
  const number = await generateNumber(supabase);
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
