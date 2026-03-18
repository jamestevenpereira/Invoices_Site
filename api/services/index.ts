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
