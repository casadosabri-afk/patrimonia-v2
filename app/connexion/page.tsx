import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { defaultRouteForRole, getSessionUser } from '@/lib/auth/session';
import { isSupabaseConfigured } from '@/lib/env';
import { SignInForm } from './SignInForm';

export const metadata: Metadata = { title: 'Connexion' };

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect(defaultRouteForRole(user.role));

  return <SignInForm supabaseEnabled={isSupabaseConfigured()} />;
}
