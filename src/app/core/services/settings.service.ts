import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { apiRequest } from '../utils/api-client';
import type { Settings } from '../models';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);

  async getSettings(): Promise<Settings> {
    const { data, error } = await this.supabase.from('settings').select('*').single();
    if (error) throw new Error('Erro ao carregar definições');
    return data as Settings;
  }

  async updateSettings(payload: Partial<Omit<Settings, 'id'>>): Promise<Settings> {
    const result = await apiRequest<Settings>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!result) throw new Error('Resposta inválida do servidor');
    return result;
  }
}
