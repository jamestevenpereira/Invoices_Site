import { TestBed } from '@angular/core/testing';
import { QuoteBuilderComponent } from './quote-builder.component';
import { provideRouter } from '@angular/router';
import { QuoteService } from '../../../core/services/quote.service';
import { ServiceCatalogueService } from '../../../core/services/service-catalogue.service';
import { SettingsService } from '../../../core/services/settings.service';
import { QuotePdfService } from '../../../core/services/quote-pdf.service';

describe('QuoteBuilderComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuoteBuilderComponent],
      providers: [
        provideRouter([]),
        { provide: QuoteService, useValue: { createQuote: jest.fn() } },
        { provide: ServiceCatalogueService, useValue: { getServices: jest.fn().mockResolvedValue([]) } },
        { provide: SettingsService, useValue: { getSettings: jest.fn().mockResolvedValue({ hourly_rate: 15, vat_mode: 'exempt', owner_email: '', agency_name: 'Test' }) } },
        { provide: QuotePdfService, useValue: { generatePdf: jest.fn() } },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(QuoteBuilderComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
