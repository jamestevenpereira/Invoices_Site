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
  client_nif: string;
  status: 'quote' | 'invoice';
  hourly_rate: number;
  items: QuoteItem[];
  notes: string;
  payment_terms: string;
  valid_until: string | null;
  total_hours: number;
  total_amount: number;
  discount_amount: number;
  discount_label: string;
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
  nif: string;
  iban: string;
}

export interface CreateQuotePayload {
  client_name: string;
  client_email: string;
  client_nif: string;
  hourly_rate: number;
  items: QuoteItem[];
  notes: string;
  payment_terms: string;
  valid_until: string | null;
  discount_amount: number;
  discount_label: string;
}

export interface UpdateQuotePayload {
  client_name?: string;
  client_email?: string;
  client_nif?: string;
  hourly_rate?: number;
  items?: QuoteItem[];
  notes?: string;
  payment_terms?: string;
  valid_until?: string | null;
  status?: 'quote' | 'invoice';
  discount_amount?: number;
  discount_label?: string;
}
