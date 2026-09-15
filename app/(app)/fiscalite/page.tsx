import type { Metadata } from 'next';
import { requireAccess } from '@/lib/auth/session';
import { getRepository } from '@/services/db';
import { buildOverview } from '@/services/portfolio';
import { PageHeader } from '@/components/ui/PageHeader';
import { TaxView, type TaxClientPreset } from '@/components/tax/TaxView';
import { fullName } from '@/lib/utils/format';

export const metadata: Metadata = { title: 'Fiscalité' };
export const dynamic = 'force-dynamic';

export default async function TaxPage() {
  const { access } = await requireAccess('advisor', 'admin');
  const repository = getRepository();

  const clients = await repository.listClients(access, { status: 'actif' });
  const records = await Promise.all(
    clients.slice(0, 12).map((client) => repository.getClientRecord(access, client.id)),
  );

  const presets: TaxClientPreset[] = [];
  for (const record of records) {
    if (!record) continue;
    const overview = await buildOverview(record);
    const primaryResidence = record.properties
      .filter((property) => property.kind === 'residence_principale')
      .reduce((sum, property) => sum + property.currentValue, 0);
    const realEstateDebt = record.debts
      .filter((debt) => debt.kind === 'credit_immobilier')
      .reduce((sum, debt) => sum + debt.remainingAmount, 0);

    presets.push({
      id: record.client.id,
      label: fullName(record.client),
      annualIncome: record.client.annualIncome,
      parts: 1 + (record.client.maritalStatus === 'marie' || record.client.maritalStatus === 'pacse' ? 1 : 0) + record.client.dependents * 0.5,
      realEstateValue: overview.patrimony.realEstateValue,
      primaryResidenceValue: primaryResidence,
      realEstateDebt,
      netWorth: overview.patrimony.netWorth,
      children: record.client.dependents,
    });
  }

  return (
    <div>
      <PageHeader
        title="Fiscalité"
        subtitle="Repères et simulations pédagogiques : impôt sur le revenu, IFI, placements, transmission."
      />
      <TaxView presets={presets} />
    </div>
  );
}
