import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { QuoteService } from '../../core/services/quote.service';
import type { Quote } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private quoteService = inject(QuoteService);

  quotes = signal<Quote[]>([]);
  error = signal('');

  invoices = computed(() => this.quotes().filter(q => q.status === 'invoice'));
  totalInvoiced = computed(() => this.invoices().reduce((s, q) => s + q.total_amount, 0));
  totalPaid = computed(() => this.invoices().filter(q => q.payment_status === 'paid').reduce((s, q) => s + q.total_amount, 0));
  totalPending = computed(() => this.invoices().filter(q => q.payment_status === 'pending').reduce((s, q) => s + q.total_amount, 0));
  totalOverdue = computed(() => this.invoices().filter(q => q.payment_status === 'overdue').reduce((s, q) => s + q.total_amount, 0));
  recentInvoices = computed(() => this.invoices().slice(0, 5));

  async ngOnInit() {
    try {
      this.quotes.set(await this.quoteService.getQuotes());
    } catch {
      this.error.set('Erro ao carregar dados');
    }
  }
}
