import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { QuoteService } from '../../../core/services/quote.service';
import { ServiceCatalogueService } from '../../../core/services/service-catalogue.service';
import { SettingsService } from '../../../core/services/settings.service';
import { QuotePdfService } from '../../../core/services/quote-pdf.service';
import type { Quote, QuoteItem, Service, Settings } from '../../../core/models';

@Component({
  selector: 'app-quote-builder',
  standalone: true,
  imports: [FormsModule, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="builder-header">
      <h2>Novo Orçamento</h2>
      <div class="actions">
        @if (savedQuote()) {
          <button (click)="downloadPdf()" class="btn-secondary">Descarregar PDF</button>
        }
        <button (click)="save()" [disabled]="saving() || items().length === 0" class="btn-primary">
          {{ saving() ? 'A guardar...' : 'Guardar rascunho' }}
        </button>
      </div>
    </div>

    <div class="meta-fields">
      <input
        [ngModel]="clientName()"
        (ngModelChange)="clientName.set($event)"
        name="clientName"
        placeholder="Nome do cliente"
      />
      <input
        [ngModel]="clientEmail()"
        (ngModelChange)="clientEmail.set($event)"
        name="clientEmail"
        type="email"
        placeholder="Email do cliente"
      />
      <textarea
        [ngModel]="notes()"
        (ngModelChange)="notes.set($event)"
        name="notes"
        placeholder="Notas (opcional)"
      ></textarea>
    </div>

    <div class="builder-panels">
      <div class="panel-services">
        <h3>Catálogo de Serviços</h3>
        @for (category of categories(); track category) {
          <div class="category">
            <h4>{{ category }}</h4>
            @for (s of servicesByCategory()[category]; track s.id) {
              <button class="service-chip" (click)="addService(s)">
                {{ s.name }} <span>{{ s.default_hours }}h</span>
              </button>
            }
          </div>
        }
      </div>

      <div class="panel-preview">
        <div class="items-list">
          @for (item of items(); track item.service_id) {
            <div class="item-row">
              <span class="item-name">{{ item.name }}</span>
              <input
                type="number"
                [value]="item.hours"
                min="0"
                step="0.5"
                (change)="updateHours(item.service_id, +$any($event.target).value)"
              />
              <span class="item-sub">{{
                item.subtotal | currency: 'EUR' : 'symbol' : '1.2-2' : 'pt'
              }}</span>
              <button (click)="removeItem(item.service_id)" class="remove">✕</button>
            </div>
          } @empty {
            <p class="empty">Clica num serviço para o adicionar.</p>
          }
        </div>

        <div class="rate-row">
          <label>Custo por hora</label>
          <input
            type="range"
            min="10"
            max="100"
            step="1"
            [value]="hourlyRate()"
            (input)="hourlyRate.set(+$any($event.target).value)"
          />
          <span class="rate-val">€{{ hourlyRate() }}/h</span>
        </div>

        <div class="totals-summary">
          <span>{{ totalHours() }}h no total</span>
          <span class="total-amount">{{
            totalAmount() | currency: 'EUR' : 'symbol' : '1.2-2' : 'pt'
          }}</span>
        </div>
      </div>
    </div>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
  `,
  styles: [
    `
      .builder-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }
      .actions {
        display: flex;
        gap: 0.5rem;
      }
      .meta-fields {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
      }
      .meta-fields input,
      .meta-fields textarea {
        padding: 0.5rem 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        flex: 1;
        min-width: 200px;
      }
      .builder-panels {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: 1rem;
      }
      .panel-services {
        background: white;
        border-radius: 8px;
        padding: 1rem;
      }
      .category {
        margin-bottom: 1rem;
      }
      h3,
      h4 {
        font-size: 0.75rem;
        text-transform: uppercase;
        color: #64748b;
        margin-bottom: 0.5rem;
      }
      .service-chip {
        display: flex;
        justify-content: space-between;
        width: 100%;
        padding: 0.5rem 0.75rem;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        cursor: pointer;
        margin-bottom: 0.25rem;
      }
      .service-chip span {
        color: #94a3b8;
        font-size: 0.85rem;
      }
      .panel-preview {
        background: white;
        border-radius: 8px;
        padding: 1rem;
      }
      .item-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0;
        border-bottom: 1px solid #f1f5f9;
      }
      .item-name {
        flex: 1;
      }
      .item-row input {
        width: 60px;
        padding: 0.25rem;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        text-align: center;
      }
      .remove {
        border: none;
        background: none;
        color: #ef4444;
        cursor: pointer;
      }
      .rate-row {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin: 1rem 0;
      }
      .rate-val {
        font-weight: 600;
        min-width: 60px;
      }
      .totals-summary {
        display: flex;
        justify-content: space-between;
        font-weight: 600;
        padding-top: 0.75rem;
        border-top: 2px solid #e2e8f0;
      }
      .total-amount {
        font-size: 1.25rem;
        color: #1e293b;
      }
      .empty {
        color: #94a3b8;
        text-align: center;
        padding: 2rem;
      }
      .btn-primary {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
      }
      .btn-secondary {
        background: white;
        border: 1px solid #e2e8f0;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
      }
      .error {
        color: #ef4444;
        margin-top: 1rem;
      }
    `,
  ],
})
export class QuoteBuilderComponent implements OnInit {
  private quoteService = inject(QuoteService);
  private catalogueService = inject(ServiceCatalogueService);
  private settingsService = inject(SettingsService);
  private pdfService = inject(QuotePdfService);
  private router = inject(Router);

  clientName = signal('');
  clientEmail = signal('');
  notes = signal('');
  hourlyRate = signal(15);
  items = signal<QuoteItem[]>([]);
  saving = signal(false);
  error = signal('');
  savedQuote = signal<Quote | null>(null);
  settings = signal<Settings | null>(null);
  categories = signal<string[]>([]);
  servicesByCategory = signal<Record<string, Service[]>>({});

  totalHours = computed(() => this.items().reduce((s, i) => s + i.hours, 0));
  totalAmount = computed(() => this.totalHours() * this.hourlyRate());

  async ngOnInit() {
    try {
      const [services, settings] = await Promise.all([
        this.catalogueService.getServices(),
        this.settingsService.getSettings(),
      ]);
      this.settings.set(settings);
      this.hourlyRate.set(settings.hourly_rate);
      const cats = [...new Set(services.filter((s) => s.active).map((s) => s.category))].sort();
      this.categories.set(cats);
      this.servicesByCategory.set(
        Object.fromEntries(
          cats.map((c) => [c, services.filter((s) => s.category === c && s.active)]),
        ),
      );
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao carregar dados');
    }
  }

  addService(s: Service) {
    if (this.items().some((i) => i.service_id === s.id)) return;
    const hours = s.default_hours;
    this.items.update((list) => [
      ...list,
      { service_id: s.id, name: s.name, hours, subtotal: hours * this.hourlyRate() },
    ]);
  }

  updateHours(serviceId: string, hours: number) {
    this.items.update((list) =>
      list.map((i) =>
        i.service_id === serviceId ? { ...i, hours, subtotal: hours * this.hourlyRate() } : i,
      ),
    );
  }

  removeItem(serviceId: string) {
    this.items.update((list) => list.filter((i) => i.service_id !== serviceId));
  }

  async save() {
    this.saving.set(true);
    this.error.set('');
    try {
      const quote = await this.quoteService.createQuote({
        client_name: this.clientName(),
        client_email: this.clientEmail(),
        hourly_rate: this.hourlyRate(),
        items: this.items().map((i) => ({ ...i, subtotal: i.hours * this.hourlyRate() })),
        notes: this.notes(),
      });
      this.savedQuote.set(quote);
      this.router.navigate(['/admin/quotes', quote.id]);
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao guardar');
    } finally {
      this.saving.set(false);
    }
  }

  downloadPdf() {
    const q = this.savedQuote();
    if (q)
      this.pdfService.generatePdf(
        q,
        this.settings()?.vat_mode ?? 'exempt',
        this.settings()?.agency_name ?? 'A Minha Agência Web',
      );
  }
}
