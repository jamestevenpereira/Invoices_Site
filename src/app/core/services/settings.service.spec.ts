import { TestBed } from '@angular/core/testing';
import { SettingsService } from './settings.service';

global.fetch = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}));

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SettingsService);
    localStorage.setItem('admin_token', 'valid-token');
  });

  afterEach(() => localStorage.clear());

  it('updateSettings() calls PUT /api/settings and returns Settings', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 1, hourly_rate: 20, owner_email: 'me@test.pt', vat_mode: 'exempt', agency_name: 'Test', sender_email: 'noreply@test.pt' }),
    });
    const result = await service.updateSettings({ hourly_rate: 20 });
    expect(fetch).toHaveBeenCalledWith('/api/settings', expect.objectContaining({ method: 'PUT' }));
    expect(result.hourly_rate).toBe(20);
  });

  it('updateSettings() throws when apiRequest returns undefined', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 204,
    });
    await expect(service.updateSettings({ hourly_rate: 20 })).rejects.toThrow('Resposta inválida');
  });
});
