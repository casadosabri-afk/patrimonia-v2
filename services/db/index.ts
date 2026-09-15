import 'server-only';

import { isSupabaseConfigured } from '@/lib/env';
import { DemoRepository } from './demoRepository';
import { SupabaseRepository } from './supabaseRepository';
import type { Repository } from './repository';

let cached: Repository | null = null;

/**
 * Sélectionne l'implémentation d'accès aux données.
 *
 * Supabase dès qu'il est configuré, sinon l'entrepôt de démonstration. Les deux
 * respectent le même contrat, de sorte que le reste de l'application ignore
 * quelle base est active.
 */
export function getRepository(): Repository {
  if (cached) return cached;
  cached = isSupabaseConfigured() ? new SupabaseRepository() : new DemoRepository();
  return cached;
}

export { DemoRepository } from './demoRepository';
export type { Repository, ClientRecord, ClientFilters } from './repository';
