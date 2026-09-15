import { redirect } from 'next/navigation';
import { defaultRouteForRole, getSessionUser } from '@/lib/auth/session';

export default async function RootPage() {
  const user = await getSessionUser();
  redirect(user ? defaultRouteForRole(user.role) : '/connexion');
}
