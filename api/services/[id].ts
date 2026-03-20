import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { verifyJwt } from '../_lib/jwt.js';
import { createAdminClient } from '../_lib/supabase.js';

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
    // Archive instead of hard delete
    const { error } = await supabase.from('services').update({ active: false }).eq('id', id);
    if (error) return res.status(500).json({ message: 'Erro ao arquivar' });
    return res.status(204).end();
  }

  return res.status(405).end();
}
