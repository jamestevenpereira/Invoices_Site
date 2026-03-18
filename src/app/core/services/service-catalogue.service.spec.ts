import { TestBed } from '@angular/core/testing';
import { ServiceCatalogueService } from './service-catalogue.service';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
  })),
}));

global.fetch = jest.fn();

describe('ServiceCatalogueService', () => {
  let service: ServiceCatalogueService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiceCatalogueService);
    localStorage.setItem('admin_token', 'valid-token');
    (fetch as jest.Mock).mockReset();
  });

  afterEach(() => localStorage.clear());

  it('createService() calls POST /api/services and returns Service', async () => {
    const mockService = { id: '1', name: 'SEO', category: 'SEO', default_hours: 4, active: true, created_at: '' };
    (fetch as jest.Mock).mockResolvedValue({ ok: true, status: 201, json: async () => mockService });

    const result = await service.createService({ name: 'SEO', category: 'SEO', default_hours: 4 });
    expect(fetch).toHaveBeenCalledWith('/api/services', expect.objectContaining({ method: 'POST' }));
    expect(result.name).toBe('SEO');
  });

  it('archiveService() calls DELETE /api/services/:id', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: true, status: 204 });
    await service.archiveService('uuid-123');
    expect(fetch).toHaveBeenCalledWith('/api/services/uuid-123', expect.objectContaining({ method: 'DELETE' }));
  });

  it('createService() throws when response is undefined', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: true, status: 204 });
    await expect(service.createService({ name: 'X', category: 'Y', default_hours: 1 })).rejects.toThrow('Resposta inválida');
  });
});
