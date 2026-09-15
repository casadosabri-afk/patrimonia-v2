import type { Metadata } from 'next';
import { requireAccess } from '@/lib/auth/session';
import { getRepository } from '@/services/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { SimulatorView } from '@/components/simulator/SimulatorView';
import { yearsUntil } from '@/lib/utils/dates';
import { CENTRAL_RETURN_PCT } from '@/lib/patrimony/goals';

export const metadata: Metadata = { title: 'Simulateur' };
export const dynamic = 'force-dynamic';

export default async function SimulatorPage() {
  const { access } = await requireAccess('advisor', 'admin');
  const repository = getRepository();

  const clients = await repository.listClients(access);
  const records = await Promise.all(
    clients.slice(0, 12).map((client) => repository.getClientRecord(access, client.id)),
  );

  // Les objectifs réels des clients servent de point de départ au simulateur.
  const presets = records
    .flatMap((record) =>
      (record?.goals ?? []).map((goal) => ({
        id: goal.id,
        label: `${record?.client.lastName ?? ''} — ${goal.label}`,
        input: {
          initialCapital: Math.round(goal.currentAmount),
          monthlyContribution: Math.round(goal.monthlyContribution),
          annualReturnPct: CENTRAL_RETURN_PCT,
          years: Math.max(1, Math.round(yearsUntil(goal.targetDate))),
          annualInflationPct: 2,
          targetAmount: Math.round(goal.targetAmount),
        },
      })),
    )
    .slice(0, 8);

  return (
    <div>
      <PageHeader
        title="Simulateur patrimonial"
        subtitle="Projetez un capital selon trois scénarios de rendement, hypothèses affichées."
      />
      <SimulatorView presets={presets} />
    </div>
  );
}
