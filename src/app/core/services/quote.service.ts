import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { apiRequest } from '../utils/api-client';
import type { Quote, CreateQuotePayload, UpdateQuotePayload } from '../models';

@Injectable({ providedIn: 'root' })
export class QuoteService {
  private supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);

  async getQuotes(): Promise<Quote[]> {
    const { data, error } = await this.supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error('Erro ao carregar orçamentos');
    return data as Quote[];
  }

  async getQuote(id: string): Promise<Quote> {
    const { data, error } = await this.supabase.from('quotes').select('*').eq('id', id).single();
    if (error) throw new Error('Orçamento não encontrado');
    return data as Quote;
  }

  async createQuote(payload: CreateQuotePayload): Promise<Quote> {
    const result = await apiRequest<Quote>('/api/quotes', { method: 'POST', body: JSON.stringify(payload) });
    if (!result) throw new Error('Resposta inválida do servidor');
    return result;
  }

  async updateQuote(id: string, payload: UpdateQuotePayload): Promise<Quote> {
    const result = await apiRequest<Quote>(`/api/quotes/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    if (!result) throw new Error('Resposta inválida do servidor');
    return result;
  }

  async convertToInvoice(id: string): Promise<Quote> {
    const result = await apiRequest<Quote>(`/api/quotes/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'invoice' }) });
    if (!result) throw new Error('Resposta inválida do servidor');
    return result;
  }
}
