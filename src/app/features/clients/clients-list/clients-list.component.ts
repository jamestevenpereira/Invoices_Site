import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { QuoteService } from '../../../core/services/quote.service';
import type { Quote } from '../../../core/models';

export interface ClientSummary {
  name: string;
  email: string;
  nif: string;
  quoteCount: number;
  invoiceCount: number;
  totalInvoiced: number;
  lastActivity: string;
}

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './clients-list.component.html',
  styleUrl: './clients-list.component.scss',
})
export class ClientsListComponent implements OnInit {
  private quoteService = inject(QuoteService);

  quotes = signal<Quote[]>([]);
  error = signal('');

  clients = computed<ClientSummary[]>(() => {
    const map = new Map<string, ClientSummary>();
    for (const q of this.quotes()) {
      const key = q.client_email;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          name: q.client_name,
          email: q.client_email,
          nif: q.client_nif,
          quoteCount: q.status === 'quote' ? 1 : 0,
          invoiceCount: q.status === 'invoice' ? 1 : 0,
          totalInvoiced: q.status === 'invoice' ? q.total_amount : 0,
          lastActivity: q.created_at,
        });
      } else {
        if (q.status === 'quote') existing.quoteCount++;
        if (q.status === 'invoice') { existing.invoiceCount++; existing.totalInvoiced += q.total_amount; }
        if (q.created_at > existing.lastActivity) existing.lastActivity = q.created_at;
      }
    }
    return Array.from(map.values()).sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));
  });

  async ngOnInit() {
    try {
      this.quotes.set(await this.quoteService.getQuotes());
    } catch {
      this.error.set('Erro ao carregar clientes');
    }
  }
}
