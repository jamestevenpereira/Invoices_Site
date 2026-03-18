import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import type { Quote } from '../models';

const MARGIN = 20;
const PAGE_W = 210;
const COL = { service: MARGIN, hours: 120, rate: 150, sub: 180 };

@Injectable({ providedIn: 'root' })
export class QuotePdfService {
  generatePdf(
    quote: Quote,
    vatMode: 'exempt' | 'standard' = 'exempt',
    agencyName: string = 'A Minha Agência Web',
  ): void {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = MARGIN;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(agencyName, MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(quote.number, PAGE_W - MARGIN, y, { align: 'right' });
    y += 5;
    doc.text(new Date(quote.created_at).toLocaleDateString('pt-PT'), PAGE_W - MARGIN, y, {
      align: 'right',
    });
    y += 12;

    // Client
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(quote.client_name, MARGIN, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(quote.client_email, MARGIN, y);
    y += 12;

    // Table header
    doc.setFillColor(241, 245, 249);
    doc.rect(MARGIN, y - 4, PAGE_W - MARGIN * 2, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Serviço', COL.service, y);
    doc.text('Horas', COL.hours, y);
    doc.text('€/hora', COL.rate, y);
    doc.text('Subtotal', COL.sub, y);
    y += 6;

    // Items
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    for (const item of quote.items) {
      doc.text(item.name, COL.service, y);
      doc.text(`${item.hours}h`, COL.hours, y);
      doc.text(this._eur(quote.hourly_rate), COL.rate, y);
      doc.text(this._eur(item.subtotal), COL.sub, y);
      y += 7;
      doc.setDrawColor(241, 245, 249);
      doc.line(MARGIN, y - 2, PAGE_W - MARGIN, y - 2);
    }

    y += 4;
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 6;

    // Totals
    const right = PAGE_W - MARGIN;
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal', right - 60, y);
    doc.text(this._eur(quote.total_amount), right, y, { align: 'right' });
    y += 6;

    if (vatMode === 'exempt') {
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Isento nos termos do art.º 53.º do CIVA', MARGIN, y);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
    } else {
      const vat = quote.total_amount * 0.23;
      doc.text('IVA 23%', right - 60, y);
      doc.text(this._eur(vat), right, y, { align: 'right' });
      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Total', right - 60, y);
      doc.text(this._eur(quote.total_amount * 1.23), right, y, { align: 'right' });
    }

    y += 10;
    if (quote.notes) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      const noteLines = doc.splitTextToSize(`Notas: ${quote.notes}`, PAGE_W - MARGIN * 2);
      doc.text(noteLines, MARGIN, y);
      doc.setTextColor(0, 0, 0);
    }

    doc.save(`${quote.number}.pdf`);
  }

  private _eur(value: number): string {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  }
}
