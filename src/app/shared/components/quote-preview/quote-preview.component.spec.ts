import { TestBed } from '@angular/core/testing';
import { QuotePreviewComponent } from './quote-preview.component';
import { ComponentRef } from '@angular/core';
import type { Quote } from '../../../core/models';

const mockQuote: Quote = {
  id: '1',
  number: 'ORC-2026-001',
  status: 'quote',
  client_name: 'Cliente Teste',
  client_email: 'cliente@teste.pt',
  hourly_rate: 15,
  items: [],
  total_hours: 0,
  total_amount: 0,
  created_at: new Date().toISOString(),
  sent_at: null,
  quote_number: null,
  notes: null,
};

describe('QuotePreviewComponent', () => {
  let componentRef: ComponentRef<QuotePreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuotePreviewComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(QuotePreviewComponent);
    componentRef = fixture.componentRef;
    componentRef.setInput('quote', mockQuote);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
