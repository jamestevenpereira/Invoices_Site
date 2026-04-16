import { render, screen } from '@testing-library/angular';
import { QuotesListComponent } from './quotes-list.component';
import { QuoteService } from '../../../core/services/quote.service';
import { QuotePdfService } from '../../../core/services/quote-pdf.service';
import { provideRouter } from '@angular/router';

const mockQuotes = [
  {
    id: '1',
    number: 'ORC-2026-001',
    client_name: 'Clínica X',
    client_email: 'x@test.pt',
    client_nif: '',
    status: 'quote',
    payment_status: 'pending',
    hourly_rate: 15,
    items: [],
    notes: '',
    payment_terms: '',
    valid_until: null,
    total_hours: 8,
    total_amount: 120,
    discount_amount: 0,
    discount_label: '',
    quote_number: null,
    sent_at: null,
    created_at: '2026-03-18T10:00:00Z',
    updated_at: '2026-03-18T10:00:00Z',
  },
];

describe('QuotesListComponent', () => {
  it('renders quotes loaded from QuoteService', async () => {
    await render(QuotesListComponent, {
      providers: [
        provideRouter([]),
        { provide: QuoteService, useValue: { getQuotes: jest.fn().mockResolvedValue(mockQuotes) } },
        { provide: QuotePdfService, useValue: { generatePdf: jest.fn() } },
      ],
    });
    expect(await screen.findByText('ORC-2026-001')).toBeTruthy();
    expect(screen.getByText('Clínica X')).toBeTruthy();
  });

  it('shows empty state when no quotes', async () => {
    await render(QuotesListComponent, {
      providers: [
        provideRouter([]),
        { provide: QuoteService, useValue: { getQuotes: jest.fn().mockResolvedValue([]) } },
        { provide: QuotePdfService, useValue: { generatePdf: jest.fn() } },
      ],
    });
    expect(await screen.findByText(/Ainda não há orçamentos/)).toBeTruthy();
  });
});
