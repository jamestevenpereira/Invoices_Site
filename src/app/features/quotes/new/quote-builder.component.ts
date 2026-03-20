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
  templateUrl: './quote-builder.component.html',
  styleUrl: './quote-builder.component.scss',
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
