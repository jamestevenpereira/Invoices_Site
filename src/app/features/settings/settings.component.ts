import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);

  loaded = signal(false);
  hourlyRate = signal(15);
  vatMode = signal<'exempt' | 'standard'>('exempt');
  ownerEmail = signal('');
  agencyName = signal('');
  senderEmail = signal('');
  nif = signal('');
  iban = signal('');
  saving = signal(false);
  saved = signal(false);
  saveError = signal('');

  async ngOnInit() {
    try {
      const s = await this.settingsService.getSettings();
      this.hourlyRate.set(s.hourly_rate);
      this.vatMode.set(s.vat_mode);
      this.ownerEmail.set(s.owner_email);
      this.agencyName.set(s.agency_name ?? '');
      this.senderEmail.set(s.sender_email ?? '');
      this.nif.set(s.nif ?? '');
      this.iban.set(s.iban ?? '');
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
        agency_name: this.agencyName(),
        sender_email: this.senderEmail(),
        nif: this.nif(),
        iban: this.iban(),
      });
      this.saved.set(true);
    } catch {
      this.saveError.set('Erro ao guardar definições');
    } finally {
      this.saving.set(false);
    }
  }
}
