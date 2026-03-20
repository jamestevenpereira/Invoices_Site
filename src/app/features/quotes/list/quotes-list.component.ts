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
  templateUrl: './quotes-list.component.html',
  styleUrl: './quotes-list.component.scss',
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
