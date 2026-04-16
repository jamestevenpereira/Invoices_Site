import { TestBed } from '@angular/core/testing';
import { ClientsListComponent } from './clients-list.component';
import { QuoteService } from '../../../core/services/quote.service';

describe('ClientsListComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientsListComponent],
      providers: [{ provide: QuoteService, useValue: { getQuotes: () => Promise.resolve([]) } }],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ClientsListComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
