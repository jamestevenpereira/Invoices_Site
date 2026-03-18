export interface QuoteItem {
  service_id: string;
  name: string;
  hours: number;
  subtotal: number;
}

export interface Quote {
  id: string;
  number: string;
  client_name: string;
  client_email: string;
  status: 'quote' | 'invoice';
  hourly_rate: number;
  items: QuoteItem[];
  notes: string;
  total_hours: number;
  total_amount: number;
  quote_number: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  default_hours: number;
  active: boolean;
  created_at: string;
}

export interface Settings {
  id: number;
  hourly_rate: number;
  owner_email: string;
  vat_mode: 'exempt' | 'standard';
  agency_name: string;
  sender_email: string;
}

export interface CreateQuotePayload {
  client_name: string;
  client_email: string;
  hourly_rate: number;
  items: QuoteItem[];
  notes: string;
}

export interface UpdateQuotePayload {
  client_name?: string;
  client_email?: string;
  hourly_rate?: number;
  items?: QuoteItem[];
  notes?: string;
  status?: 'quote' | 'invoice';
}
