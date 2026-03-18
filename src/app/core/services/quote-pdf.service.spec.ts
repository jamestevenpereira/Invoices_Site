import { TestBed } from '@angular/core/testing';
import { QuotePdfService } from './quote-pdf.service';
import type { Quote } from '../models';

jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => ({
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    setFillColor: jest.fn(),
    setDrawColor: jest.fn(),
    setTextColor: jest.fn(),
    text: jest.fn(),
    line: jest.fn(),
    rect: jest.fn(),
    save: jest.fn(),
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
  })),
}));

const mockQuote: Quote = {
  id: 'uuid-1', number: 'ORC-2026-001', client_name: 'Test Client',
  client_email: 'test@example.com', status: 'quote', hourly_rate: 15,
  items: [{ service_id: 's1', name: 'Homepage', hours: 8, subtotal: 120 }],
  notes: '', total_hours: 8, total_amount: 120,
  quote_number: null, sent_at: null, created_at: '2026-03-18', updated_at: '2026-03-18',
};

describe('QuotePdfService', () => {
  let service: QuotePdfService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuotePdfService);
  });

  it('generatePdf() calls jsPDF and triggers save with correct filename', () => {
    const { jsPDF } = require('jspdf');
    service.generatePdf(mockQuote);
    const instance = jsPDF.mock.results[0].value;
    expect(instance.save).toHaveBeenCalledWith('ORC-2026-001.pdf');
    expect(instance.text).toHaveBeenCalled();
  });

  it('generatePdf() includes client name in the document', () => {
    const { jsPDF } = require('jspdf');
    service.generatePdf(mockQuote);
    const instance = jsPDF.mock.results[0].value;
    const textCalls = instance.text.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(textCalls.some(t => t.includes('Test Client'))).toBe(true);
  });
});
