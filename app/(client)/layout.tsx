import { AppShell } from '@/components/layout/AppShell';
import { requireAccess } from '@/lib/auth/session';
import { getRepository } from '@/services/db';
import { isSupabaseConfigured } from '@/lib/env';

/** Espace client : interface simplifiée, sans données internes au cabinet. */
export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, access } = await requireAccess('client');
  const firm = await getRepository().getFirm(access);

  return (
    <AppShell
      user={user}
      firmName={firm?.branding.firmName ?? 'PATRIMONIA'}
      openAlerts={0}
      demoMode={!isSupabaseConfigured()}
    >
      {children}
    </AppShell>
  );
}
