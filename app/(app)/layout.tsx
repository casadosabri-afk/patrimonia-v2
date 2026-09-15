import { AppShell } from '@/components/layout/AppShell';
import { requireAccess } from '@/lib/auth/session';
import { getRepository } from '@/services/db';
import { isSupabaseConfigured } from '@/lib/env';

/** Espace cabinet : conseillers et administrateurs uniquement. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, access } = await requireAccess('advisor', 'admin');
  const repository = getRepository();

  const [firm, alerts] = await Promise.all([
    repository.getFirm(access),
    repository.listAlerts(access, { status: 'ouverte' }),
  ]);

  return (
    <AppShell
      user={user}
      firmName={firm?.branding.firmName ?? 'PATRIMONIA'}
      openAlerts={alerts.length}
      demoMode={!isSupabaseConfigured()}
    >
      {children}
    </AppShell>
  );
}
