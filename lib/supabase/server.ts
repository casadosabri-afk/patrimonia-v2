import 'server-only';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { publicEnv, isSupabaseConfigured } from '@/lib/env';

/**
 * Client Supabase pour le rendu serveur et les actions serveur.
 *
 * Renvoie `null` lorsque Supabase n'est pas configuré : l'application bascule
 * alors en mode démonstration.
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) return null;

  const env = publicEnv();
  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL as string, env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // `setAll` est appelé depuis un composant serveur en lecture seule :
          // le rafraîchissement du jeton est alors assuré par le middleware.
        }
      },
    },
  });
}
