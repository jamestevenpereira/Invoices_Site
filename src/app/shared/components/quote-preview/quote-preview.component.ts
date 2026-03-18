import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import type { Quote } from '../../../core/models';

@Component({
  selector: 'app-quote-preview',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="preview">
      <div class="preview-header">
        <div class="agency">A Minha Agência Web</div>
        <div class="doc-meta">
          <div class="doc-number">{{ quote().number }}</div>
          <div class="doc-date">{{ quote().created_at | date:'dd/MM/yyyy' }}</div>
        </div>
      </div>
      <div class="client-info">
        <strong>{{ quote().client_name }}</strong><br />
        {{ quote().client_email }}
      </div>
      <table class="items-table">
        <thead>
          <tr><th>Serviço</th><th>Horas</th><th>€/hora</th><th>Subtotal</th></tr>
        </thead>
        <tbody>
          @for (item of quote().items; track item.service_id) {
            <tr>
              <td>{{ item.name }}</td>
              <td>{{ item.hours }}h</td>
              <td>{{ quote().hourly_rate | currency:'EUR':'symbol':'1.2-2':'pt' }}</td>
              <td>{{ item.subtotal | currency:'EUR':'symbol':'1.2-2':'pt' }}</td>
            </tr>
          }
        </tbody>
      </table>
      <div class="totals">
        <div class="total-row">
          <span>Subtotal</span>
          <span>{{ quote().total_amount | currency:'EUR':'symbol':'1.2-2':'pt' }}</span>
        </div>
        @if (vatMode() === 'exempt') {
          <div class="vat-row exempt">Isento nos termos do art.º 53.º do CIVA</div>
        } @else {
          <div class="total-row">
            <span>IVA 23%</span>
            <span>{{ quote().total_amount * 0.23 | currency:'EUR':'symbol':'1.2-2':'pt' }}</span>
          </div>
          <div class="total-row grand">
            <span>Total</span>
            <span>{{ quote().total_amount * 1.23 | currency:'EUR':'symbol':'1.2-2':'pt' }}</span>
          </div>
        }
      </div>
      @if (quote().notes) {
        <div class="notes"><strong>Notas:</strong> {{ quote().notes }}</div>
      }
    </div>
  `,
  styles: [`
    .preview { font-family: system-ui, sans-serif; font-size: .9rem; color: #1e293b; }
    .preview-header { display: flex; justify-content: space-between; margin-bottom: 1.5rem; }
    .agency { font-weight: 700; font-size: 1.1rem; }
    .doc-number { font-weight: 600; }
    .doc-date { color: #64748b; font-size: .85rem; }
    .client-info { margin-bottom: 1.5rem; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
    .items-table th { background: #f1f5f9; padding: .5rem; text-align: left; font-size: .8rem; }
    .items-table td { padding: .5rem; border-bottom: 1px solid #f1f5f9; }
    .totals { text-align: right; padding-top: .75rem; border-top: 2px solid #e2e8f0; }
    .total-row { display: flex; justify-content: flex-end; gap: 2rem; padding: .25rem 0; }
    .grand { font-weight: 700; font-size: 1.1rem; border-top: 1px solid #1e293b; padding-top: .5rem; }
    .vat-row.exempt { font-size: .75rem; color: #64748b; margin-top: .5rem; }
    .notes { margin-top: 1rem; padding: .75rem; background: #f8fafc; border-radius: 6px; }
  `],
})
export class QuotePreviewComponent {
  quote = input.required<Quote>();
  vatMode = input<'exempt' | 'standard'>('exempt');
}
