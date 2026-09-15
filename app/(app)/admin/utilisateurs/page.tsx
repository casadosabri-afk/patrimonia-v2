import type { Metadata } from 'next';
import { requireAccess } from '@/lib/auth/session';
import { getRepository } from '@/services/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { UsersTable } from '@/components/admin/UsersTable';

export const metadata: Metadata = { title: 'Utilisateurs' };
export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const { user, access } = await requireAccess('admin');
  const users = await getRepository().listUsers(access);

  return (
    <div>
      <PageHeader
        title="Utilisateurs"
        subtitle="Comptes du cabinet : conseillers, administrateurs et accès clients."
      />
      <UsersTable users={users} currentUserId={user.id} />
    </div>
  );
}
