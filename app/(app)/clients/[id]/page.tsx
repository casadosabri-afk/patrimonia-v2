import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAccess } from '@/lib/auth/session';
import { getRepository } from '@/services/db';
import { getClientOverview } from '@/services/portfolio';
import { computeDebtMetrics, computePropertyMetrics, debtServiceRatio } from '@/lib/patrimony/debt';
import { projectGoal } from '@/lib/patrimony/goals';
import { fullName } from '@/lib/utils/format';
import { ClientDetail } from '@/components/clients/ClientDetail';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { access } = await requireAccess('advisor', 'admin');
  const client = await getRepository().getClient(access, id);
  return { title: client ? fullName(client) : 'Client introuvable' };
}

export default async function ClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ section?: string }>;
}) {
  const { id } = await params;
  const { section } = await searchParams;
  const { access } = await requireAccess('advisor', 'admin');
  const repository = getRepository();

  const overview = await getClientOverview(access, id);
  if (!overview) notFound();

  const [users, interactions, appointments, documents, conversations, alerts] = await Promise.all([
    repository.listUsers(access),
    repository.listInteractions(access, id),
    repository.listAppointments(access, id),
    repository.listDocuments(access, id),
    repository.listConversations(access),
    repository.listAlerts(access, { clientId: id, status: 'tous' }),
  ]);

  const conversation = conversations.find((item) => item.clientId === id) ?? null;
  const messages = conversation ? await repository.listMessages(access, conversation.id) : [];

  const propertyMetrics = overview.record.properties.map((property) =>
    computePropertyMetrics(property, overview.record.debts),
  );
  const debtMetrics = overview.record.debts.map((debt) => computeDebtMetrics(debt));
  const goalProjections = overview.record.goals.map((goal) => projectGoal(goal));

  const advisorsById = new Map(users.map((user) => [user.id, user]));
  const primaryLink = overview.record.client.advisors.find((link) => link.primary);

  return (
    <ClientDetail
      initialSection={section ?? 'apercu'}
      client={overview.record.client}
      accounts={overview.record.accounts}
      patrimony={overview.patrimony}
      investments={overview.investments}
      propertyMetrics={propertyMetrics}
      debtMetrics={debtMetrics}
      debtRatio={debtServiceRatio(overview.record.debts, overview.record.client.annualIncome)}
      goals={goalProjections}
      insights={overview.insights}
      score={overview.score}
      priceOrigin={overview.priceOrigin}
      priceProvider={overview.priceProvider}
      alerts={alerts}
      interactions={interactions}
      appointments={appointments}
      documents={documents}
      conversationId={conversation?.id ?? null}
      messages={messages}
      primaryAdvisor={primaryLink ? (advisorsById.get(primaryLink.advisorId) ?? null) : null}
      associateAdvisors={overview.record.client.advisors
        .filter((link) => !link.primary)
        .map((link) => advisorsById.get(link.advisorId))
        .filter((user): user is NonNullable<typeof user> => Boolean(user))}
      advisors={users.filter((user) => user.role === 'advisor' || user.role === 'admin')}
    />
  );
}
