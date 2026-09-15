import type { Metadata } from 'next';
import { requireAccess } from '@/lib/auth/session';
import { getRepository } from '@/services/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { Inbox, type ConversationBundle } from '@/components/messaging/Inbox';
import { fullName } from '@/lib/utils/format';

export const metadata: Metadata = { title: 'Messagerie' };
export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  const { access } = await requireAccess('advisor', 'admin');
  const repository = getRepository();

  const [conversations, clients, users] = await Promise.all([
    repository.listConversations(access),
    repository.listClients(access),
    repository.listUsers(access),
  ]);

  const clientsById = new Map(clients.map((client) => [client.id, client]));
  const usersById = new Map(users.map((user) => [user.id, user]));

  const bundles: ConversationBundle[] = await Promise.all(
    conversations.map(async (conversation) => {
      const advisor = usersById.get(conversation.advisorId);
      return {
        conversation,
        client: clientsById.get(conversation.clientId) ?? null,
        messages: await repository.listMessages(access, conversation.id),
        advisorName: advisor ? fullName(advisor) : 'Conseiller',
      };
    }),
  );

  return (
    <div>
      <PageHeader
        title="Messagerie"
        subtitle="Échanges directs avec vos clients, rattachés à leur dossier."
      />
      <Inbox bundles={bundles} />
    </div>
  );
}
