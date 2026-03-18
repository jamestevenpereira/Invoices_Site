import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { signToken } from '../_lib/jwt';

const schema = z.object({ password: z.string().min(1) });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: 'Pedido inválido' });

  if (result.data.password !== process.env['ADMIN_PASSWORD']) {
    return res.status(401).json({ message: 'Palavra-passe incorrecta' });
  }

  const token = await signToken();
  return res.status(200).json({ token });
}
