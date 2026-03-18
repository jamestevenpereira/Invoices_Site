import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import { verifyJwt } from '../../_lib/jwt';
import { createAdminClient } from '../../_lib/supabase';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!await verifyJwt(req)) return res.status(401).json({ message: 'Não autorizado' });

  const { id } = req.query as { id: string };
  const supabase = createAdminClient();

  const { data: quote, error: fetchError } = await supabase.from('quotes').select('*').eq('id', id).single();
  if (fetchError || !quote) return res.status(404).json({ message: 'Orçamento não encontrado' });

  const { data: settings } = await supabase.from('settings').select('owner_email, vat_mode, agency_name, sender_email').single();

  const isInvoice = (quote.status as string) === 'invoice';
  const docType = isInvoice ? 'Fatura' : 'Orçamento';
  const agencyName = (settings?.agency_name as string | null) ?? 'A Minha Agência Web';
  const senderEmail = (settings?.sender_email as string | null) ?? 'noreply@agencia.pt';

  const itemsHtml = (quote.items as Array<{ name: string; hours: number }>)
    .map(i => `<tr><td>${esc(i.name)}</td><td>${i.hours}h</td><td>€${(i.hours * (quote.hourly_rate as number)).toFixed(2)}</td></tr>`)
    .join('');

  const vatLine = (settings?.vat_mode as string) === 'standard'
    ? `<tr><td colspan="2"><strong>IVA 23%</strong></td><td>€${((quote.total_amount as number) * 0.23).toFixed(2)}</td></tr>
       <tr><td colspan="2"><strong>Total</strong></td><td><strong>€${((quote.total_amount as number) * 1.23).toFixed(2)}</strong></td></tr>`
    : `<tr><td colspan="3" style="font-size:12px;color:#64748b">Isento nos termos do art.º 53.º do CIVA</td></tr>`;

  const html = `
    <h2>${docType} ${esc(quote.number as string)}</h2>
    <p>Exmo(a) ${esc(quote.client_name as string)},</p>
    <p>${isInvoice ? 'Segue em anexo a fatura relativa aos serviços prestados.' : 'Segue o orçamento solicitado.'}</p>
    <table border="1" cellpadding="8" style="border-collapse:collapse;width:100%">
      <thead><tr><th>Serviço</th><th>Horas</th><th>Subtotal</th></tr></thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot>${vatLine}</tfoot>
    </table>
    ${(quote.notes as string) ? `<p><em>Notas: ${esc(quote.notes as string)}</em></p>` : ''}
    <p>Com os melhores cumprimentos</p>
  `;

  const resend = new Resend(process.env['RESEND_API_KEY']);
  const sends = [
    resend.emails.send({
      from: senderEmail,
      to: [quote.client_email as string],
      subject: `${docType} ${esc(quote.number as string)} — ${agencyName}`,
      html,
      text: `${docType} ${esc(quote.number as string)}\n\nCliente: ${esc(quote.client_name as string)}\nTotal: €${quote.total_amount}`,
    }),
  ];

  if (settings?.owner_email) {
    sends.push(
      resend.emails.send({
        from: senderEmail,
        to: [settings.owner_email as string],
        subject: `[Cópia] ${docType} ${esc(quote.number as string)} enviado para ${esc(quote.client_email as string)}`,
        html: `<p>Cópia enviada em ${new Date().toLocaleString('pt-PT')}.</p>${html}`,
        text: `Cópia enviada para ${quote.client_email}`,
      })
    );
  }

  try {
    await Promise.all(sends);
  } catch {
    return res.status(500).json({ message: 'Falha ao enviar email — tente novamente' });
  }

  await supabase.from('quotes').update({ sent_at: new Date().toISOString() }).eq('id', id);
  return res.status(200).json({ success: true });
}
