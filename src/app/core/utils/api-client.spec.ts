import { apiRequest } from './api-client';

global.fetch = jest.fn();

describe('apiRequest', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    localStorage.clear();
  });

  it('includes Authorization header when token exists', async () => {
    localStorage.setItem('admin_token', 'test-token');
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: 'ok' }),
    });

    await apiRequest('/api/test');

    expect(fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: 'Bearer test-token',
      }),
    }));
  });

  it('omits Authorization header when no token', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: 'ok' }),
    });

    await apiRequest('/api/test');

    expect(fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
      headers: expect.not.objectContaining({
        Authorization: expect.anything(),
      }),
    }));
  });

  it('throws when response is not ok', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Não autorizado' }),
    });

    await expect(apiRequest('/api/test')).rejects.toThrow('Não autorizado');
  });

  it('returns undefined for 204 No Content', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => { throw new Error('no body'); },
    });

    const result = await apiRequest('/api/test');
    expect(result).toBeUndefined();
  });
});
