import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ServiceCatalogueService } from '../../core/services/service-catalogue.service';
import type { Service } from '../../core/models';

@Component({
  selector: 'app-services-catalogue',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <h2>Catálogo de Serviços</h2>
      <button (click)="showForm.set(true)" class="btn-primary">+ Novo Serviço</button>
    </div>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    @if (showForm()) {
      <form class="inline-form" (ngSubmit)="save()">
        <input [(ngModel)]="form.name" name="name" placeholder="Nome do serviço" required />
        <input [(ngModel)]="form.category" name="category" placeholder="Categoria" list="cats" required />
        <datalist id="cats">
          @for (cat of categories(); track cat) { <option [value]="cat"></option> }
        </datalist>
        <input type="number" [(ngModel)]="form.default_hours" name="default_hours"
          placeholder="Horas" min="0" step="0.5" required />
        <button type="submit">{{ editingId() ? 'Actualizar' : 'Criar' }}</button>
        <button type="button" (click)="cancelForm()">Cancelar</button>
      </form>
    }

    @for (category of categories(); track category) {
      <div class="category-block">
        <h3>{{ category }}</h3>
        <table>
          <thead>
            <tr><th>Serviço</th><th>Horas padrão</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            @for (s of servicesByCategory()[category]; track s.id) {
              <tr [class.archived]="!s.active">
                <td>{{ s.name }}</td>
                <td>{{ s.default_hours }}h</td>
                <td>{{ s.active ? 'Activo' : 'Arquivado' }}</td>
                <td class="actions">
                  <button (click)="edit(s)">Editar</button>
                  @if (s.active) {
                    <button (click)="archive(s.id)" class="danger">Arquivar</button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .inline-form { background: white; padding: 1rem; border-radius: 8px; display: flex; gap: .75rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .inline-form input { padding: .5rem; border: 1px solid #e2e8f0; border-radius: 6px; }
    .category-block { background: white; border-radius: 8px; padding: 1rem 1.5rem; margin-bottom: 1rem; }
    h3 { color: #64748b; font-size: .8rem; text-transform: uppercase; letter-spacing: .05em; margin-bottom: .75rem; }
    table { width: 100%; border-collapse: collapse; }
    td, th { padding: .5rem .75rem; text-align: left; border-bottom: 1px solid #f1f5f9; }
    .archived { opacity: .5; }
    .actions { display: flex; gap: .5rem; }
    .btn-primary { background: #3b82f6; color: white; border: none; padding: .5rem 1rem; border-radius: 6px; cursor: pointer; }
    button { padding: .375rem .75rem; border-radius: 6px; border: 1px solid #e2e8f0; cursor: pointer; background: white; }
    .danger { color: #ef4444; border-color: #fca5a5; }
    .error { color: #ef4444; }
  `],
})
export class ServicesCatalogueComponent implements OnInit {
  private svc = inject(ServiceCatalogueService);

  services = signal<Service[]>([]);
  showForm = signal(false);
  editingId = signal<string | null>(null);
  categories = signal<string[]>([]);
  servicesByCategory = signal<Record<string, Service[]>>({});
  error = signal('');
  form = { name: '', category: '', default_hours: 0 };

  async ngOnInit() { await this.load(); }

  async load() {
    try {
      const all = await this.svc.getServices();
      this.services.set(all);
      const cats = [...new Set(all.map(s => s.category))].sort();
      this.categories.set(cats);
      this.servicesByCategory.set(
        Object.fromEntries(cats.map(c => [c, all.filter(s => s.category === c)]))
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
