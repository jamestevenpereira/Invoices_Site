import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { QuoteService } from '../../../core/services/quote.service';
import { QuotePdfService } from '../../../core/services/quote-pdf.service';
import type { Quote } from '../../../core/models';

@Component({
  selector: 'app-quotes-list',
  standalone: true,
  imports: [RouterLink, DatePipe, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <h2>Orçamentos & Faturas</h2>
      <a routerLink="/admin/quotes/new" class="btn-primary">+ Novo Orçamento</a>
    </div>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    @if (quotes().length === 0) {
      <p class="empty">Ainda não há orçamentos. Cria o primeiro!</p>
    } @else {
      <table class="quotes-table">
        <thead>
          <tr>
            <th>Número</th>
            <th>Cliente</th>
            <th>Estado</th>
            <th>Total</th>
            <th>Data</th>
            <th>Enviado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (q of quotes(); track q.id) {
            <tr>
              <td>
                <a [routerLink]="['/admin/quotes', q.id]">{{ q.number }}</a>
              </td>
              <td>{{ q.client_name }}</td>
              <td>
                <span class="badge" [class.invoice]="q.status === 'invoice'">
                  {{ q.status === 'invoice' ? 'Fatura' : 'Orçamento' }}
                </span>
              </td>
              <td>{{ q.total_amount | currency: 'EUR' : 'symbol' : '1.2-2' : 'pt' }}</td>
              <td>{{ q.created_at | date: 'dd/MM/yyyy' }}</td>
              <td>{{ q.sent_at ? (q.sent_at | date: 'dd/MM/yyyy') : '—' }}</td>
              <td><button (click)="downloadPdf(q)" class="btn-sm">PDF</button></td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
  styles: [
    `
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      .btn-primary {
        background: #3b82f6;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        text-decoration: none;
      }
      .quotes-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
        border-radius: 8px;
        overflow: hidden;
      }
      th,
      td {
        padding: 0.75rem 1rem;
        text-align: left;
        border-bottom: 1px solid #f1f5f9;
      }
      th {
        background: #f8fafc;
        font-size: 0.8rem;
        color: #64748b;
        text-transform: uppercase;
      }
      .badge {
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        font-size: 0.75rem;
        background: #fef3c7;
        color: #92400e;
      }
      .badge.invoice {
        background: #dcfce7;
        color: #166534;
      }
      .btn-sm {
        padding: 0.25rem 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.8rem;
        background: white;
      }
      .empty {
        color: #94a3b8;
        text-align: center;
        padding: 3rem;
      }
      .error {
        color: #ef4444;
      }
      a {
        color: #3b82f6;
        text-decoration: none;
      }
    `,
  ],
})
export class QuotesListComponent implements OnInit {
  private quoteService = inject(QuoteService);
  private pdfService = inject(QuotePdfService);
  quotes = signal<Quote[]>([]);
  error = signal('');

  async ngOnInit() {
    try {
      this.quotes.set(await this.quoteService.getQuotes());
    } catch {
      this.error.set('Erro ao carregar orçamentos');
    }
  }

  downloadPdf(q: Quote) {
    this.pdfService.generatePdf(q);
  }
}
