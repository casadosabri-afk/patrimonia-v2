import { z } from 'zod';

/**
 * Lecture centralisée des variables d'environnement SERVEUR.
 *
 * Aucune clé secrète n'est exposée au navigateur : ce module ne doit être
 * importé que depuis du code serveur. Les variables destinées au client sont
 * préfixées `NEXT_PUBLIC_` et regroupées plus bas.
 */
const serverSchema = z.object({
  MARKET_DATA_PROVIDER: z.enum(['auto', 'yahoo', 'fmp', 'mock']).default('auto'),
  FMP_API_KEY: z.string().min(1).optional(),
  MARKET_DATA_CACHE_TTL: z.coerce.number().int().positive().default(120),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(16).optional(),
  DEMO_MODE: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value !== 'false'),
});

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type PublicEnv = z.infer<typeof publicSchema>;

let cachedServerEnv: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
  if (cachedServerEnv) return cachedServerEnv;
  const parsed = serverSchema.safeParse(process.env);
  cachedServerEnv = parsed.success
    ? parsed.data
    : serverSchema.parse({});
  return cachedServerEnv;
}

export function publicEnv(): PublicEnv {
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
  return parsed.success ? parsed.data : {};
}

/** `true` lorsque Supabase est configuré ; sinon l'application tourne en mode démonstration. */
export function isSupabaseConfigured(): boolean {
  const env = publicEnv();
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function appUrl(): string {
  return publicEnv().NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}
