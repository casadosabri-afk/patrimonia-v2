'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * Client Supabase navigateur.
 *
 * Seule la clé anonyme publique est utilisée ici. Aucune clé de service ne doit
 * être exposée au navigateur : elle reste confinée au serveur.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  if (!client) client = createBrowserClient(url, anonKey);
  return client;
}
