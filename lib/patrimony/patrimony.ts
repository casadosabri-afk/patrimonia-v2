import type {
  AllocationSlice,
  AssetAccount,
  AssetBucket,
  AssetClass,
  BucketSlice,
  Debt,
  NetWorthPoint,
  Patrimony,
  RealEstateAsset,
  ValuedInvestment,
} from '@/types';
import { ASSET_CLASS_BUCKET, ASSET_CLASS_LABELS, BUCKET_LABELS } from '@/lib/utils/labels';

export interface PatrimonyInput {
  clientId: string;
  accounts: AssetAccount[];
  investments: ValuedInvestment[];
  properties: RealEstateAsset[];
  debts: Debt[];
  history: NetWorthPoint[];
}

/** Valeur d'un bien immobilier au prorata de la quote-part détenue. */
export function propertyShareValue(property: RealEstateAsset): number {
  return (property.currentValue * property.ownershipPct) / 100;
}

/** Classe patrimoniale retenue pour les espèces d'une enveloppe. */
function cashAssetClass(kind: AssetAccount['kind']): AssetClass {
  switch (kind) {
    case 'compte_courant':
    case 'livret':
      return 'liquidites';
    case 'assurance_vie':
      return 'assurance_vie';
    case 'pea':
      return 'pea';
    case 'per':
      return 'per';
    case 'compte_titres':
      return 'compte_titres';
    case 'crypto':
      return 'crypto';
    case 'private_equity':
      return 'private_equity';
    default:
      return 'liquidites';
  }
}

/**
 * Consolide le patrimoine d'un client.
 *
 * Les lignes d'investissement sont rattachées à la classe d'actifs de leur
 * enveloppe fiscale lorsque celle-ci est structurante (PEA, assurance-vie,
 * PER), afin que la répartition affichée corresponde à la lecture d'un
 * conseiller.
 */
export function computePatrimony(input: PatrimonyInput): Patrimony {
  const accountById = new Map(input.accounts.map((account) => [account.id, account]));
  const byClass = new Map<AssetClass, number>();

  const add = (key: AssetClass, value: number) => {
    byClass.set(key, (byClass.get(key) ?? 0) + value);
  };

  for (const account of input.accounts) {
    if (account.cashBalance !== 0) add(cashAssetClass(account.kind), account.cashBalance);
  }

  for (const investment of input.investments) {
    const account = accountById.get(investment.accountId);
    const key = envelopeAssetClass(account?.kind, investment.assetClass);
    add(key, investment.value);
  }

  let realEstateValue = 0;
  for (const property of input.properties) {
    const value = propertyShareValue(property);
    realEstateValue += value;
    add('immobilier', value);
  }

  const grossAssets = [...byClass.values()].reduce((sum, value) => sum + value, 0);
  const totalDebt = input.debts.reduce((sum, debt) => sum + debt.remainingAmount, 0);
  const netWorth = grossAssets - totalDebt;

  const allocation: AllocationSlice[] = [...byClass.entries()]
    .filter(([, value]) => value > 0.5)
    .map(([key, value]) => ({
      key,
      label: ASSET_CLASS_LABELS[key],
      bucket: ASSET_CLASS_BUCKET[key],
      value,
      sharePct: grossAssets > 0 ? (value / grossAssets) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const bucketTotals = new Map<AssetBucket, number>();
  for (const slice of allocation) {
    bucketTotals.set(slice.bucket, (bucketTotals.get(slice.bucket) ?? 0) + slice.value);
  }

  const buckets: BucketSlice[] = (['immobilier', 'financier', 'liquidites', 'autres'] as const)
    .map((key) => ({
      key,
      label: BUCKET_LABELS[key],
      value: bucketTotals.get(key) ?? 0,
      sharePct: grossAssets > 0 ? ((bucketTotals.get(key) ?? 0) / grossAssets) * 100 : 0,
    }))
    .filter((bucket) => bucket.value > 0);

  const liquidity = byClass.get('liquidites') ?? 0;
  const financialValue = allocation
    .filter((slice) => slice.bucket === 'financier')
    .reduce((sum, slice) => sum + slice.value, 0);
  const otherValue = allocation
    .filter((slice) => slice.bucket === 'autres')
    .reduce((sum, slice) => sum + slice.value, 0);

  const history = input.history;
  const first = history[0];
  const last = history[history.length - 1];
  const yearPerformancePct =
    first && last && first.netWorth > 0 ? ((last.netWorth - first.netWorth) / first.netWorth) * 100 : 0;

  return {
    clientId: input.clientId,
    grossAssets,
    totalDebt,
    netWorth,
    liquidity,
    realEstateValue,
    financialValue,
    otherValue,
    allocation,
    buckets,
    history,
    yearPerformancePct,
  };
}

/** L'enveloppe fiscale prime sur la nature de l'instrument pour PEA/AV/PER. */
export function envelopeAssetClass(
  kind: AssetAccount['kind'] | undefined,
  fallback: AssetClass,
): AssetClass {
  switch (kind) {
    case 'pea':
      return 'pea';
    case 'assurance_vie':
      return 'assurance_vie';
    case 'per':
      return 'per';
    case 'crypto':
      return 'crypto';
    case 'private_equity':
      return 'private_equity';
    default:
      return fallback;
  }
}

/** Exposition « actions » réelle, transparisée à travers les enveloppes. */
export function equityExposurePct(investments: ValuedInvestment[], grossAssets: number): number {
  if (grossAssets <= 0) return 0;
  const equity = investments
    .filter((item) => item.assetClass === 'actions' || item.assetClass === 'etf')
    .reduce((sum, item) => sum + item.value, 0);
  return (equity / grossAssets) * 100;
}
