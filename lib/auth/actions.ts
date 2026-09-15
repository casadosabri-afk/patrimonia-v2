'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getDemoStore } from '@/services/db/demoStore';
import { isSupabaseConfigured } from '@/lib/env';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { DEMO_PASSWORD } from './demoAccounts';
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS, defaultRouteForRole, getSessionUser } from './session';
import { createSessionToken } from './token';

const credentialsSchema = z.object({
  email: z.string().trim().min(1, 'Adresse e-mail requise').email('Adresse e-mail invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export interface SignInState {
  error: string | null;
}

/**
 * Connexion.
 *
 * Avec Supabase configuré, l'authentification est déléguée à Supabase Auth.
 * Sinon, les comptes de démonstration sont acceptés avec le mot de passe partagé
 * documenté dans le README.
 */
export async function signIn(_state: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Identifiants invalides.' };
  }

  const { email, password } = parsed.data;

  if (isSupabaseConfigured()) {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: 'Adresse e-mail ou mot de passe incorrect.' };
      const user = await getSessionUser();
      redirect(user ? defaultRouteForRole(user.role) : '/dashboard');
    }
  }

  const account = getDemoStore().users.find(
    (user) => user.email.toLowerCase() === email.toLowerCase(),
  );

  if (!account || password !== DEMO_PASSWORD) {
    return { error: 'Adresse e-mail ou mot de passe incorrect.' };
  }

  if (!account.active) {
    return { error: 'Ce compte est désactivé. Contactez l’administrateur du cabinet.' };
  }

  account.lastLoginAt = new Date().toISOString();

  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(account.id), SESSION_COOKIE_OPTIONS);

  redirect(defaultRouteForRole(account.role));
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await getSupabaseServerClient();
    await supabase?.auth.signOut();
  }

  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect('/connexion');
}
