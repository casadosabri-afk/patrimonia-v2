import type { Metadata } from 'next';
import { requireAccess } from '@/lib/auth/session';
import { getRepository } from '@/services/db';
import { AlertsView } from '@/components/alerts/AlertsView';

export const metadata: Metadata = { title: 'Alertes' };
export const dynamic = 'force-dynamic';

export default async function AlertsPage() {
  const { access } = await requireAccess('advisor', 'admin');
  const repository = getRepository();

  const [alerts, clients, users] = await Promise.all([
    repository.listAlerts(access, { status: 'tous' }),
    repository.listClients(access),
    repository.listUsers(access),
  ]);

  return (
    <AlertsView
      alerts={alerts}
      clients={clients}
      advisors={users.filter((user) => user.role === 'advisor' || user.role === 'admin')}
    />
  );
}
