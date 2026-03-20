import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { QuoteService } from '../../../core/services/quote.service';
import { QuotePdfService } from '../../../core/services/quote-pdf.service';
import { SettingsService } from '../../../core/services/settings.service';
import { QuotePreviewComponent } from '../../../shared/components/quote-preview/quote-preview.component';
import { apiRequest } from '../../../core/utils/api-client';
import type { Quote, Settings } from '../../../core/models';

@Component({
  selector: 'app-quote-detail',
  standalone: true,
  imports: [QuotePreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quote-detail.component.html',
  styleUrl: './quote-detail.component.scss',
})
export class QuoteDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private quoteService = inject(QuoteService);
  private pdfService = inject(QuotePdfService);
  private settingsService = inject(SettingsService);

  quote = signal<Quote | null>(null);
  settings = signal<Settings | null>(null);
  sending = signal(false);
  converting = signal(false);
  sendSuccess = signal(false);
  error = signal('');

  async ngOnInit() {
    try {
      const id = this.route.snapshot.paramMap.get('id')!;
      const [quote, settings] = await Promise.all([
        this.quoteService.getQuote(id),
        this.settingsService.getSettings(),
      ]);
      this.quote.set(quote);
      this.settings.set(settings);
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao carregar orçamento');
    }
  }

  downloadPdf() {
    const q = this.quote();
    if (q)
      this.pdfService.generatePdf(
        q,
        this.settings()?.vat_mode ?? 'exempt',
        this.settings()?.agency_name ?? 'A Minha Agência Web',
      );
  }

  async sendEmail() {
    const q = this.quote();
    if (!q) return;
    this.sending.set(true);
    this.sendSuccess.set(false);
    this.error.set('');
    try {
      const result = await apiRequest<{ success: boolean }>(`/api/quotes/${q.id}/send`, {
        method: 'POST',
      });
      if (!result) throw new Error('Falha ao enviar — tente novamente');
      this.quote.update((current) =>
        current ? { ...current, sent_at: new Date().toISOString() } : null,
      );
      this.sendSuccess.set(true);
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Falha ao enviar — tente novamente');
    } finally {
      this.sending.set(false);
    }
  }

  async convert() {
    const q = this.quote();
    if (!q) return;
    if (!confirm('Converter este orçamento em fatura? Esta acção não pode ser revertida.')) return;
    this.converting.set(true);
    try {
      const updated = await this.quoteService.convertToInvoice(q.id);
      this.quote.set(updated);
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao converter');
    } finally {
      this.converting.set(false);
    }
  }
}
