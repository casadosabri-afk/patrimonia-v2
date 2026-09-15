import 'server-only';

import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Role, SessionUser } from '@/types';
import { getDemoStore } from '@/services/db/demoStore';
import { isSupabaseConfigured } from '@/lib/env';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { AccessContext } from '@/services/db/access';
import { SESSION_MAX_AGE_SECONDS, verifySessionToken } from './token';

export const SESSION_COOKIE = 'patrimonia_session';

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_MAX_AGE_SECONDS,
} as const;

/**
 * Résout l'utilisateur courant CÔTÉ SERVEUR.
 *
 * Le rôle et le cabinet ne sont jamais lus depuis le navigateur : ils sont
 * rechargés depuis la base (ou l'entrepôt de démonstration) à partir du seul
 * identifiant contenu dans la session.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (isSupabaseConfigured()) {
    const supabaseUser = await getSupabaseSessionUser();
    if (supabaseUser) return supabaseUser;
  }

  const store = await cookies();
  const payload = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!payload) return null;

  const account = getDemoStore().users.find((user) => user.id === payload.userId);
  if (!account || !account.active) return null;

  return {
    id: account.id,
    firmId: account.firmId,
    role: account.role,
    email: account.email,
    firstName: account.firstName,
    lastName: account.lastName,
    avatarColor: account.avatarColor,
    clientId: account.clientId,
  };
});

async function getSupabaseSessionUser(): Promise<SessionUser | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  // Le profil porte le rôle et le cabinet : ils proviennent de la base, jamais
  // des métadonnées modifiables côté client.
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, firm_id, role, email, first_name, last_name, avatar_color, client_id, active')
    .eq('id', data.user.id)
    .single();

  if (!profile || profile.active === false) return null;

  return {
    id: profile.id as string,
    firmId: profile.firm_id as string,
    role: profile.role as Role,
    email: (profile.email as string) ?? data.user.email ?? '',
    firstName: (profile.first_name as string) ?? '',
    lastName: (profile.last_name as string) ?? '',
    avatarColor: (profile.avatar_color as string) ?? '#4152ab',
    clientId: (profile.client_id as string | null) ?? null,
  };
}

export async function requireSession(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect('/connexion');
  return user;
}

/** Garde de route : redirige vers l'espace autorisé si le rôle ne convient pas. */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireSession();
  if (!roles.includes(user.role)) redirect(defaultRouteForRole(user.role));
  return user;
}

export function defaultRouteForRole(role: Role): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'client':
      return '/espace-client';
    default:
      return '/dashboard';
  }
}

export function toAccessContext(user: SessionUser): AccessContext {
  return { userId: user.id, firmId: user.firmId, role: user.role, clientId: user.clientId };
}

/** Contexte d'accès de la requête courante, ou redirection vers la connexion. */
export async function requireAccess(...roles: Role[]): Promise<{ user: SessionUser; access: AccessContext }> {
  const user = roles.length > 0 ? await requireRole(...roles) : await requireSession();
  return { user, access: toAccessContext(user) };
}
