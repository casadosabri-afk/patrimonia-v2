import type { Metadata } from 'next';
import { requireAccess } from '@/lib/auth/session';
import { getRepository } from '@/services/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { CrmBoard } from '@/components/crm/CrmBoard';

export const metadata: Metadata = { title: 'CRM' };
export const dynamic = 'force-dynamic';

export default async function CrmPage() {
  const { access } = await requireAccess('advisor', 'admin');
  const repository = getRepository();

  const [interactions, clients, users] = await Promise.all([
    repository.listInteractions(access),
    repository.listClients(access),
    repository.listUsers(access),
  ]);

  return (
    <div>
      <PageHeader
        title="CRM"
        subtitle="Tâches, appels, e-mails et notes rattachés à chaque dossier client."
      />
      <CrmBoard
        interactions={interactions}
        clients={clients}
        advisors={users.filter((user) => user.role === 'advisor' || user.role === 'admin')}
      />
    </div>
  );
}
