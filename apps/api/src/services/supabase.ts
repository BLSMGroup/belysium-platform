import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Types matching the DB schema ─────────────────────────────────────────────

export interface Lead {
  id?: string;
  name: string;
  email: string;
  company?: string;
  division: 'professional' | 'developments' | 'invest' | 'family' | 'life' | 'general';
  message?: string;
  source_page?: string;
  created_at?: string;
}

export interface ChatSession {
  id?: string;
  session_id: string;
  division: string;
  messages: Array<{ role: string; content: string }>;
  lead_captured: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface License {
  id?: string;
  email: string;
  tier: 'starter' | 'professional' | 'enterprise' | 'realestate';
  tools_allowed: string[];
  uses_remaining: number | null; // null = unlimited
  expires_at: string | null;    // null = lifetime
  license_key: string;
  order_id?: string;
  created_at?: string;
}

// ── DB helpers ────────────────────────────────────────────────────────────────

export async function saveLead(lead: Lead) {
  const { data, error } = await supabase.from('leads').insert(lead).select().single();
  if (error) throw error;
  return data;
}

export async function upsertSession(session: ChatSession) {
  const { error } = await supabase
    .from('chat_sessions')
    .upsert({ ...session, updated_at: new Date().toISOString() }, { onConflict: 'session_id' });
  if (error) throw error;
}

export async function createLicense(license: Omit<License, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('licenses').insert(license).select().single();
  if (error) throw error;
  return data;
}

export async function getLicenseByKey(licenseKey: string): Promise<License | null> {
  const { data } = await supabase
    .from('licenses')
    .select('*')
    .eq('license_key', licenseKey)
    .single();
  return data;
}

export async function decrementUse(licenseKey: string) {
  // Only decrements if uses_remaining > 0; no-op for unlimited (null)
  await supabase.rpc('decrement_license_use', { key: licenseKey });
}
