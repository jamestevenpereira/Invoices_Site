import { Injectable, signal } from '@angular/core';
import { apiRequest } from '../utils/api-client';

const TOKEN_KEY = 'admin_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _authenticated = signal(this._checkToken());

  isAuthenticated(): boolean {
    return this._authenticated();
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  async login(password: string): Promise<void> {
    const result = await apiRequest<{ token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    if (!result) throw new Error('Resposta inválida do servidor');
    localStorage.setItem(TOKEN_KEY, result.token);
    this._authenticated.set(true);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this._authenticated.set(false);
  }

  private _checkToken(): boolean {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    try {
      const [, payload] = token.split('.');
      const decoded = JSON.parse(atob(payload));
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
}
