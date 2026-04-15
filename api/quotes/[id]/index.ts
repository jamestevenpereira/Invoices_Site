import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { verifyJwt } from '../../_lib/jwt.js';
import { createAdminClient } from '../../_lib/supabase.js';

const itemSchema = z.object({
  service_id: z.string(),
  name: z.string(),
  hours: z.number().min(0),
  subtotal: z.number().min(0),
});

const schema = z.object({
  client_name: z.string().min(1).optional(),
  client_email: z.string().email().optional(),
  hourly_rate: z.number().min(1).optional(),
  items: z.array(itemSchema).optional(),
  notes: z.string().optional(),
  status: z.enum(['invoice']).optional(),
  discount_amount: z.number().min(0).optional(),
  discount_label: z.string().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT' && req.method !== 'DELETE') return res.status(405).end();
  if (!await verifyJwt(req)) return res.status(401).json({ message: 'Não autorizado' });

  const { id } = req.query as { id: string };

  if (req.method === 'DELETE') {
    const supabase = createAdminClient();
    const { error } = await supabase.from('quotes').delete().eq('id', id);
    if (error) return res.status(500).json({ message: 'Erro ao eliminar' });
    return res.status(204).end();
  }
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: 'Dados inválidos' });

  const supabase = createAdminClient();
  const updates: Record<string, unknown> = { ...result.data };

  // Recompute totals if items, rate or discount changed
  if (
    result.data.items !== undefined ||
    result.data.hourly_rate !== undefined ||
    result.data.discount_amount !== undefined
  ) {
    const { data: current } = await supabase
      .from('quotes')
      .select('items, hourly_rate, discount_amount')
      .eq('id', id)
      .single();

    const items = (result.data.items ?? (current?.items as Array<{ hours: number }> | null) ?? []) as Array<{ hours: number }>;
    const rate = result.data.hourly_rate ?? (current?.hourly_rate as number | null) ?? 15;
    const discount = result.data.discount_amount ?? (current?.discount_amount as number | null) ?? 0;
    updates['total_hours'] = items.reduce((sum, i) => sum + i.hours, 0);
    updates['total_amount'] = (updates['total_hours'] as number) * rate - discount;
  }

  // Convert to invoice: generate FAT number
  if (result.data.status === 'invoice') {
    const { data: current } = await supabase
      .from('quotes')
      .select('number, status')
      .eq('id', id)
      .single();

    if ((current?.status as string) === 'quote') {
      const year = new Date().getFullYear();
      const { data: lastFat } = await supabase
        .from('quotes')
        .select('number')
        .like('number', `FAT-${year}-%`)
        .order('number', { ascending: false })
        .limit(1);

      const lastFatNum = (lastFat as Array<{ number: string }> | null)?.[0]?.number;
      const next = lastFatNum ? parseInt(lastFatNum.split('-')[2], 10) + 1 : 1;
      updates['number'] = `FAT-${year}-${String(next).padStart(3, '0')}`;
      updates['quote_number'] = (current?.number as string | null) ?? null;
    }
  }

  const { data, error } = await supabase
    .from('quotes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'Número de documento já existe — tente novamente' });
    return res.status(500).json({ message: 'Erro ao actualizar' });
  }
  return res.status(200).json(data);
}
