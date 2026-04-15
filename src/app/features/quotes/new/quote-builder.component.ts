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
import { ActivatedRoute, Router } from '@angular/router';
import { QuoteService } from '../../../core/services/quote.service';
import { ServiceCatalogueService } from '../../../core/services/service-catalogue.service';
import { SettingsService } from '../../../core/services/settings.service';
import { QuotePdfService } from '../../../core/services/quote-pdf.service';
import { QuotePreviewComponent } from '../../../shared/components/quote-preview/quote-preview.component';
import type { Quote, QuoteItem, Service, Settings } from '../../../core/models';

@Component({
  selector: 'app-quote-builder',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, QuotePreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quote-builder.component.html',
  styleUrl: './quote-builder.component.scss',
})
export class QuoteBuilderComponent implements OnInit {
  private quoteService = inject(QuoteService);
  private catalogueService = inject(ServiceCatalogueService);
  private settingsService = inject(SettingsService);
  private pdfService = inject(QuotePdfService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Edit mode
  editId = signal<string | null>(null);
  editQuote = signal<Quote | null>(null);

  // Form fields
  clientName = signal('');
  clientEmail = signal('');
  clientNif = signal('');
  notes = signal('');
  paymentTerms = signal('');
  validUntil = signal('');
  hourlyRate = signal(15);
  items = signal<QuoteItem[]>([]);
  discountAmount = signal(0);
  discountLabel = signal('');

  // UI state
  saving = signal(false);
  loading = signal(false);
  error = signal('');
  savedQuote = signal<Quote | null>(null);
  settings = signal<Settings | null>(null);
  categories = signal<string[]>([]);
  servicesByCategory = signal<Record<string, Service[]>>({});
  showPreview = signal(false);

  isEditMode = computed(() => this.editId() !== null);
  pageTitle = computed(() => this.isEditMode() ? 'Editar Orçamento' : 'Novo Orçamento');

  totalHours = computed(() => this.items().reduce((s, i) => s + i.hours, 0));
  subtotal = computed(() => this.totalHours() * this.hourlyRate());
  totalAmount = computed(() => this.subtotal() - this.discountAmount());

  previewQuote = computed<Quote>(() => {
    const eq = this.editQuote();
    return {
      id: eq?.id ?? 'draft',
      number: eq?.number ?? 'ORC/RASCUNHO',
      client_name: this.clientName() || 'Nome do cliente',
      client_email: this.clientEmail() || '',
      client_nif: this.clientNif(),
      status: 'quote',
      hourly_rate: this.hourlyRate(),
      items: this.items(),
      notes: this.notes(),
      payment_terms: this.paymentTerms(),
      valid_until: this.validUntil() || null,
      total_hours: this.totalHours(),
      total_amount: this.totalAmount(),
      discount_amount: this.discountAmount(),
      discount_label: this.discountLabel(),
      quote_number: null,
      sent_at: null,
      created_at: eq?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  async ngOnInit() {
    this.loading.set(true);
    try {
      const id = this.route.snapshot.paramMap.get('id');
      this.editId.set(id);

      const [services, settings] = await Promise.all([
        this.catalogueService.getServices(),
        this.settingsService.getSettings(),
      ]);
      this.settings.set(settings);

      const cats = [...new Set(services.filter((s) => s.active).map((s) => s.category))].sort();
      this.categories.set(cats);
      this.servicesByCategory.set(
        Object.fromEntries(
          cats.map((c) => [c, services.filter((s) => s.category === c && s.active)]),
        ),
      );

      if (id) {
        // Edit mode: load existing quote
        const quote = await this.quoteService.getQuote(id);
        this.editQuote.set(quote);
        this.clientName.set(quote.client_name);
        this.clientEmail.set(quote.client_email);
        this.clientNif.set(quote.client_nif ?? '');
        this.notes.set(quote.notes ?? '');
        this.paymentTerms.set(quote.payment_terms ?? '');
        this.validUntil.set(quote.valid_until ?? '');
        this.hourlyRate.set(quote.hourly_rate);
        this.items.set(quote.items);
        this.discountAmount.set(quote.discount_amount ?? 0);
        this.discountLabel.set(quote.discount_label ?? '');
      } else {
        // Create mode: use default rate from settings
        this.hourlyRate.set(settings.hourly_rate);
      }
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao carregar dados');
    } finally {
      this.loading.set(false);
    }
  }

  addService(s: Service) {
    if (this.items().some((i) => i.service_id === s.id)) return;
    const hours = Number(s.default_hours) || 0;
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

  readonly paymentSuggestions = [
    '50% adiantamento, restante na entrega',
    'Pagamento integral adiantado',
    'Pagamento na entrega do projecto',
    'Pagamento a 15 dias após entrega',
    'Pagamento a 30 dias após entrega',
    '1/3 início · 1/3 meio · 1/3 final',
  ];

  applyPaymentSuggestion(text: string) {
    this.paymentTerms.set(text);
  }

  async save() {
    this.saving.set(true);
    this.error.set('');
    const payload = {
      client_name: this.clientName(),
      client_email: this.clientEmail(),
      client_nif: this.clientNif(),
      hourly_rate: this.hourlyRate(),
      items: this.items().map((i) => ({ ...i, subtotal: i.hours * this.hourlyRate() })),
      notes: this.notes(),
      payment_terms: this.paymentTerms(),
      valid_until: this.validUntil() || null,
      discount_amount: this.discountAmount(),
      discount_label: this.discountLabel(),
    };
    try {
      const id = this.editId();
      if (id) {
        await this.quoteService.updateQuote(id, payload);
        this.router.navigate(['/admin/quotes', id]);
      } else {
        const quote = await this.quoteService.createQuote(payload);
        this.savedQuote.set(quote);
        this.router.navigate(['/admin/quotes', quote.id]);
      }
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
