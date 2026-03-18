import { TestBed } from '@angular/core/testing';
import { QuoteService } from './quote.service';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  })),
}));

global.fetch = jest.fn();

const mockQuote = {
  id: 'uuid-1', number: 'ORC-2026-001', client_name: 'Clínica X',
  client_email: 'info@clinica.pt', status: 'quote', hourly_rate: 15,
  items: [], notes: '', total_hours: 0, total_amount: 0,
  quote_number: null, sent_at: null, created_at: '', updated_at: '',
};

describe('QuoteService', () => {
  let service: QuoteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuoteService);
    localStorage.setItem('admin_token', 'valid-token');
    (fetch as jest.Mock).mockReset();
  });

  afterEach(() => localStorage.clear());

  it('createQuote() calls POST /api/quotes and returns Quote', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: true, status: 201, json: async () => mockQuote });
    const result = await service.createQuote({
      client_name: 'Clínica X', client_email: 'info@clinica.pt',
      hourly_rate: 15, items: [], notes: '',
    });
    expect(fetch).toHaveBeenCalledWith('/api/quotes', expect.objectContaining({ method: 'POST' }));
    expect(result.number).toBe('ORC-2026-001');
  });

  it('convertToInvoice() calls PUT /api/quotes/:id with status invoice', async () => {
    const invoice = { ...mockQuote, status: 'invoice', number: 'FAT-2026-001' };
    (fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200, json: async () => invoice });
    const result = await service.convertToInvoice('uuid-1');
    expect(fetch).toHaveBeenCalledWith('/api/quotes/uuid-1', expect.objectContaining({ method: 'PUT' }));
    expect(result.status).toBe('invoice');
  });

  it('createQuote() throws when apiRequest returns undefined', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: true, status: 204 });
    await expect(service.createQuote({ client_name: 'X', client_email: 'x@test.pt', hourly_rate: 15, items: [], notes: '' }))
      .rejects.toThrow('Resposta inválida');
  });
});
