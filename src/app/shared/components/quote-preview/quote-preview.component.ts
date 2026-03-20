import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import type { Quote } from '../../../core/models';

@Component({
  selector: 'app-quote-preview',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quote-preview.component.html',
  styleUrl: './quote-preview.component.scss',
})
export class QuotePreviewComponent {
  quote = input.required<Quote>();
  vatMode = input<'exempt' | 'standard'>('exempt');
  agencyName = input<string>('A Minha Agência Web');
}
