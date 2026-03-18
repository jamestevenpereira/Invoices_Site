import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

global.fetch = jest.fn();

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
    localStorage.clear();
  });

  it('isAuthenticated() returns false when no token', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('isAuthenticated() returns false for invalid JWT', () => {
    localStorage.setItem('admin_token', 'not-a-jwt');
    expect(service.isAuthenticated()).toBe(false);
  });

  it('login() stores token on success', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ token: 'header.payload.sig' }),
    });
    await service.login('password');
    expect(localStorage.getItem('admin_token')).toBe('header.payload.sig');
  });

  it('login() throws on wrong password', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Palavra-passe incorrecta' }),
    });
    await expect(service.login('wrong')).rejects.toThrow('Palavra-passe incorrecta');
  });

  it('logout() removes token', () => {
    localStorage.setItem('admin_token', 'token');
    service.logout();
    expect(localStorage.getItem('admin_token')).toBeNull();
  });
});
