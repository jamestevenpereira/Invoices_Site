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
  template: `
    @if (quote()) {
      <div class="detail-header">
        <div>
          <h2>{{ quote()!.number }}</h2>
          @if (quote()!.quote_number) {
            <p class="sub">Convertido de {{ quote()!.quote_number }}</p>
          }
        </div>
        <div class="actions">
          <button (click)="downloadPdf()" class="btn-secondary">Descarregar PDF</button>
          <button (click)="sendEmail()" [disabled]="sending()" class="btn-secondary">
            {{
              sending()
                ? 'A enviar...'
                : quote()!.sent_at
                  ? 'Reenviar por email'
                  : 'Enviar por email'
            }}
          </button>
          @if (quote()!.status === 'quote') {
            <button (click)="convert()" [disabled]="converting()" class="btn-convert">
              {{ converting() ? 'A converter...' : 'Converter em Fatura' }}
            </button>
          }
        </div>
      </div>

      @if (sendSuccess()) {
        <p class="success">Email enviado com sucesso.</p>
      }
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      <div class="preview-wrap">
        <app-quote-preview [quote]="quote()!" [vatMode]="settings()?.vat_mode ?? 'exempt'" />
      </div>
    } @else {
      <p>A carregar...</p>
    }
  `,
  styles: [
    `
      .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;
      }
      .sub {
        font-size: 0.85rem;
        color: #64748b;
      }
      .actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .preview-wrap {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        max-width: 700px;
      }
      .btn-secondary {
        background: white;
        border: 1px solid #e2e8f0;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
      }
      .btn-convert {
        background: #16a34a;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
      }
      .success {
        color: #16a34a;
        margin-bottom: 1rem;
      }
      .error {
        color: #ef4444;
        margin-bottom: 1rem;
      }
    `,
  ],
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
    const id = this.route.snapshot.paramMap.get('id')!;
    const [quote, settings] = await Promise.all([
      this.quoteService.getQuote(id),
      this.settingsService.getSettings(),
    ]);
    this.quote.set(quote);
    this.settings.set(settings);
  }

  downloadPdf() {
    const q = this.quote();
    if (q) this.pdfService.generatePdf(q, this.settings()?.vat_mode ?? 'exempt');
  }

  async sendEmail() {
    const q = this.quote();
    if (!q) return;
    this.sending.set(true);
    this.sendSuccess.set(false);
    this.error.set('');
    try {
      await apiRequest(`/api/quotes/${q.id}/send`, { method: 'POST' });
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
