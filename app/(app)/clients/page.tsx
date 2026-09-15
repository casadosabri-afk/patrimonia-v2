import type { Metadata } from 'next';
import { requireAccess } from '@/lib/auth/session';
import { getRepository } from '@/services/db';
import { getClientSummaries } from '@/services/portfolio';
import { ClientsView } from '@/components/clients/ClientsView';

export const metadata: Metadata = { title: 'Clients' };
export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
  const { access } = await requireAccess('advisor', 'admin');
  const repository = getRepository();

  const [clients, users] = await Promise.all([
    repository.listClients(access),
    repository.listUsers(access),
  ]);

  const summaries = await getClientSummaries(access, clients);
  const advisors = users.filter((user) => user.role === 'advisor' || user.role === 'admin');

  return <ClientsView summaries={summaries} advisors={advisors} canCreate />;
}
