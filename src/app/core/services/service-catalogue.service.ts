import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { apiRequest } from '../utils/api-client';
import type { Service } from '../models';

@Injectable({ providedIn: 'root' })
export class ServiceCatalogueService {
  private supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);

  async getServices(): Promise<Service[]> {
    const { data, error } = await this.supabase
      .from('services')
      .select('*')
      .order('category')
      .order('name');
    if (error) throw new Error('Erro ao carregar serviços');
    return data as Service[];
  }

  async createService(payload: { name: string; category: string; default_hours: number }): Promise<Service> {
    const result = await apiRequest<Service>('/api/services', { method: 'POST', body: JSON.stringify(payload) });
    if (!result) throw new Error('Resposta inválida do servidor');
    return result;
  }

  async updateService(id: string, payload: Partial<{ name: string; category: string; default_hours: number }>): Promise<Service> {
    const result = await apiRequest<Service>(`/api/services/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    if (!result) throw new Error('Resposta inválida do servidor');
    return result;
  }

  async archiveService(id: string): Promise<void> {
    await apiRequest<void>(`/api/services/${id}`, { method: 'DELETE' });
  }
}
