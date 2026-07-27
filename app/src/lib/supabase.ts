import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export const PRESENCE_CHANNEL = 'sipa-ecosystem-presence';

/**
 * Auth0 issues the JWT; Supabase (Third-Party Auth) verifies it against
 * the Auth0 issuer. RLS reads auth.jwt()->>'sub', not Supabase's own auth.uid().
 */
export function makeSupabaseClient(accessToken?: string | null): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : {},
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  });
}
