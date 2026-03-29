import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { verifyJwt } from '../_lib/jwt.js';
import { createAdminClient } from '../_lib/supabase.js';

const schema = z.object({
  hourly_rate: z.number().min(1).max(500).optional(),
  owner_email: z.string().email().optional(),
  vat_mode: z.enum(['exempt', 'standard']).optional(),
  agency_name: z.string().max(200).optional(),
  sender_email: z.string().email().optional(),
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
