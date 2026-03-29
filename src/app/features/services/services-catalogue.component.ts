import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ServiceCatalogueService } from '../../core/services/service-catalogue.service';
import type { Service } from '../../core/models';

@Component({
  selector: 'app-services-catalogue',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './services-catalogue.component.html',
  styleUrl: './services-catalogue.component.scss',
})
export class ServicesCatalogueComponent implements OnInit {
  private svc = inject(ServiceCatalogueService);

  services = signal<Service[]>([]);
  totalServices = computed(() => this.services().length);
  showForm = signal(false);
  editingId = signal<string | null>(null);
  categories = signal<string[]>([]);
  servicesByCategory = signal<Record<string, Service[]>>({});
  error = signal('');
  form = { name: '', category: '', default_hours: 0 };

  async ngOnInit() {
    await this.load();
  }

  async load() {
    try {
      const all = await this.svc.getServices();
      this.services.set(all);
      const cats = [...new Set(all.map((s) => s.category))].sort();
      this.categories.set(cats);
      this.servicesByCategory.set(
        Object.fromEntries(cats.map((c) => [c, all.filter((s) => s.category === c)])),
      );
    } catch {
      this.error.set('Erro ao carregar serviços');
    }
  }

  edit(s: Service) {
    this.editingId.set(s.id);
    this.form = { name: s.name, category: s.category, default_hours: s.default_hours };
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form = { name: '', category: '', default_hours: 0 };
  }

  async save() {
    try {
      const id = this.editingId();
      if (id) {
        await this.svc.updateService(id, this.form);
      } else {
        await this.svc.createService(this.form);
      }
      this.cancelForm();
      await this.load();
    } catch {
      this.error.set('Erro ao guardar serviço');
    }
  }

  async archive(id: string) {
    try {
      await this.svc.archiveService(id);
      await this.load();
    } catch {
      this.error.set('Erro ao arquivar serviço');
    }
  }
}
