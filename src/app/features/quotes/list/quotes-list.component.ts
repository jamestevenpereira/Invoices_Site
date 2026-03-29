import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { QuoteService } from '../../../core/services/quote.service';
import { QuotePdfService } from '../../../core/services/quote-pdf.service';
import { SettingsService } from '../../../core/services/settings.service';
import type { Quote, Settings } from '../../../core/models';

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
  private settingsService = inject(SettingsService);
  quotes = signal<Quote[]>([]);
  settings = signal<Settings | null>(null);
  error = signal('');

  async ngOnInit() {
    try {
      const [quotes, settings] = await Promise.all([
        this.quoteService.getQuotes(),
        this.settingsService.getSettings(),
      ]);
      this.quotes.set(quotes);
      this.settings.set(settings);
    } catch {
      this.error.set('Erro ao carregar orçamentos');
    }
  }

  async downloadPdf(q: Quote) {
    await this.pdfService.generatePdf(
      q,
      this.settings()?.vat_mode ?? 'exempt',
      this.settings()?.agency_name ?? 'A Minha Agência Web',
    );
  }

  async deleteQuote(q: Quote) {
    const label = q.status === 'invoice' ? 'fatura' : 'orçamento';
    if (!confirm(`Eliminar ${label} ${q.number}? Esta acção não pode ser desfeita.`)) return;
    try {
      await this.quoteService.deleteQuote(q.id);
      this.quotes.update((list) => list.filter((x) => x.id !== q.id));
    } catch {
      this.error.set('Erro ao eliminar documento');
    }
  }
}
