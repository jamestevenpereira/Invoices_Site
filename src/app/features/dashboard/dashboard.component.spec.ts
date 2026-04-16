import { TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { QuoteService } from '../../core/services/quote.service';

describe('DashboardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [{ provide: QuoteService, useValue: { getQuotes: () => Promise.resolve([]) } }],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
