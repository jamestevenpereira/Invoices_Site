import { TestBed } from '@angular/core/testing';
import { QuoteDetailComponent } from './quote-detail.component';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { QuoteService } from '../../../core/services/quote.service';
import { QuotePdfService } from '../../../core/services/quote-pdf.service';
import { SettingsService } from '../../../core/services/settings.service';

describe('QuoteDetailComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuoteDetailComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'test-id' } } } },
        { provide: QuoteService, useValue: { getQuote: jest.fn().mockResolvedValue(null), convertToInvoice: jest.fn() } },
        { provide: QuotePdfService, useValue: { generatePdf: jest.fn() } },
        { provide: SettingsService, useValue: { getSettings: jest.fn().mockResolvedValue({ hourly_rate: 15, vat_mode: 'exempt', owner_email: '', agency_name: 'Test' }) } },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(QuoteDetailComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
