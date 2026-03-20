import { TestBed } from '@angular/core/testing';
import { SettingsComponent } from './settings.component';
import { SettingsService } from '../../core/services/settings.service';

describe('SettingsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        {
          provide: SettingsService,
          useValue: {
            getSettings: jest.fn().mockResolvedValue({ hourly_rate: 15, vat_mode: 'exempt', owner_email: '' }),
            updateSettings: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(SettingsComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
