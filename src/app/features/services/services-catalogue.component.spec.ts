import { TestBed } from '@angular/core/testing';
import { ServicesCatalogueComponent } from './services-catalogue.component';
import { ServiceCatalogueService } from '../../core/services/service-catalogue.service';

describe('ServicesCatalogueComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicesCatalogueComponent],
      providers: [
        {
          provide: ServiceCatalogueService,
          useValue: {
            getServices: jest.fn().mockResolvedValue([]),
            createService: jest.fn(),
            updateService: jest.fn(),
            archiveService: jest.fn(),
          },
        },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ServicesCatalogueComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
