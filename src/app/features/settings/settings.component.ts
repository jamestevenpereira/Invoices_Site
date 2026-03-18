import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>Definições</h2>
    @if (loaded()) {
      <form (ngSubmit)="save()" class="settings-form">
        <section>
          <h3>Custo por hora</h3>
          <div class="slider-row">
            <input type="range" min="10" max="100" step="1"
              [ngModel]="hourlyRate()" (ngModelChange)="hourlyRate.set(+$event)" name="hourly_rate" />
            <span class="rate-value">€{{ hourlyRate() }}/hora</span>
          </div>
        </section>
        <section>
          <h3>IVA</h3>
          <label class="radio">
            <input type="radio" name="vat_mode" value="exempt"
              [ngModel]="vatMode()" (ngModelChange)="vatMode.set($event)" />
            Isento (art.º 53.º CIVA)
          </label>
          <label class="radio">
            <input type="radio" name="vat_mode" value="standard"
              [ngModel]="vatMode()" (ngModelChange)="vatMode.set($event)" />
            23% IVA
          </label>
        </section>
        <section>
          <h3>Email do proprietário</h3>
          <input type="email" [ngModel]="ownerEmail()" (ngModelChange)="ownerEmail.set($event)"
            name="owner_email" placeholder="o-seu-email@dominio.pt" />
        </section>
        <button type="submit" [disabled]="saving()">
          {{ saving() ? 'A guardar...' : 'Guardar definições' }}
        </button>
        @if (saved()) {
          <p class="success">Definições guardadas.</p>
        }
        @if (saveError()) {
          <p class="error">{{ saveError() }}</p>
        }
      </form>
    } @else {
      <p>A carregar...</p>
    }
  `,
  styles: [`
    h2 { margin-bottom: 1.5rem; }
    section { background: white; padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem; }
    h3 { font-size: .9rem; color: #64748b; margin-bottom: 1rem; }
    .slider-row { display: flex; align-items: center; gap: 1rem; }
    input[type=range] { flex: 1; }
    .rate-value { font-size: 1.5rem; font-weight: 700; color: #1e293b; min-width: 100px; }
    .radio { display: flex; align-items: center; gap: .5rem; margin-bottom: .5rem; cursor: pointer; }
    input[type=email] { width: 100%; padding: .625rem; border: 1px solid #e2e8f0; border-radius: 6px; }
    button { background: #3b82f6; color: white; padding: .75rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; }
    button:disabled { opacity: .6; }
    .success { color: #16a34a; margin-top: .75rem; }
    .error { color: #ef4444; margin-top: .75rem; }
  `],
})
export class SettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);

  loaded = signal(false);
  hourlyRate = signal(15);
  vatMode = signal<'exempt' | 'standard'>('exempt');
  ownerEmail = signal('');
  saving = signal(false);
  saved = signal(false);
  saveError = signal('');

  async ngOnInit() {
    try {
      const s = await this.settingsService.getSettings();
      this.hourlyRate.set(s.hourly_rate);
      this.vatMode.set(s.vat_mode);
      this.ownerEmail.set(s.owner_email);
      this.loaded.set(true);
    } catch {
      this.saveError.set('Erro ao carregar definições');
    }
  }

  async save() {
    this.saving.set(true);
    this.saved.set(false);
    this.saveError.set('');
    try {
      await this.settingsService.updateSettings({
        hourly_rate: this.hourlyRate(),
        owner_email: this.ownerEmail(),
        vat_mode: this.vatMode(),
      });
      this.saved.set(true);
    } catch {
      this.saveError.set('Erro ao guardar definições');
    } finally {
      this.saving.set(false);
    }
  }
}
