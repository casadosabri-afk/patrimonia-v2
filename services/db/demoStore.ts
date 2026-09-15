import type {
  Alert,
  AlertComment,
  Appointment,
  AssetAccount,
  AuditEntry,
  Client,
  Conversation,
  Debt,
  Firm,
  Goal,
  Interaction,
  Investment,
  Message,
  RealEstateAsset,
  StoredDocument,
  UserAccount,
  QrToken,
} from '@/types';
import { DEMO_FIRMS, DEMO_USERS } from '@/data/demo/people';
import { buildAllBundles, buildStandaloneAlerts } from '@/data/demo/build';
import { buildActivity } from '@/data/demo/activity';
import { computePatrimony } from '@/lib/patrimony/patrimony';
import { valueInvestments } from '@/lib/patrimony/valuation';
import { buildNetWorthHistory } from '@/lib/patrimony/history';
import { analyzeClient } from '@/lib/intelligence/rules';
import { createRng, seedFrom } from '@/lib/utils/random';

/**
 * Entrepôt mémoire du MODE DÉMONSTRATION.
 *
 * Il tient lieu de base de données lorsque Supabase n'est pas configuré. Les
 * mutations effectuées depuis l'interface (traitement d'une alerte, ajout d'une
 * note, création d'un rendez-vous…) sont appliquées ici et persistent le temps
 * de l'exécution du serveur.
 */
export interface DemoStore {
  firms: Firm[];
  users: UserAccount[];
  clients: Client[];
  accounts: AssetAccount[];
  investments: Investment[];
  properties: RealEstateAsset[];
  debts: Debt[];
  goals: Goal[];
  alerts: Alert[];
  interactions: Interaction[];
  appointments: Appointment[];
  conversations: Conversation[];
  messages: Message[];
  documents: StoredDocument[];
  audit: AuditEntry[];
  qrTokens: QrToken[];
  /** Contenu binaire des documents déposés en mode démonstration. */
  documentBlobs: Map<string, { mimeType: string; base64: string }>;
  seededAt: Date;
}

const SEVERITY_TO_ALERT = {
  critique: 'critique',
  eleve: 'eleve',
  moyen: 'moyen',
  faible: 'faible',
} as const;

const KIND_TO_CATEGORY = {
  risque: 'risque',
  opportunite: 'opportunite',
  information: 'client',
  action: 'administratif',
} as const;

function seedStore(): DemoStore {
  const now = new Date();
  const bundles = buildAllBundles(now);
  const activity = buildActivity(now);

  const clients = bundles.map((bundle) => bundle.client);
  const accounts = bundles.flatMap((bundle) => bundle.accounts);
  const investments = bundles.flatMap((bundle) => bundle.investments);
  const properties = bundles.flatMap((bundle) => bundle.properties);
  const debts = bundles.flatMap((bundle) => bundle.debts);
  const goals = bundles.flatMap((bundle) => bundle.goals);

  // Les alertes patrimoniales sont produites par PATRIMONIA INTELLIGENCE à
  // partir des dernières valorisations connues, puis stockées comme n'importe
  // quelle alerte : elles peuvent ensuite être attribuées, commentées, traitées.
  const generated: Alert[] = [];

  for (const bundle of bundles) {
    const valued = valueInvestments(bundle.investments, { prices: new Map(), fxToEur: { USD: 0.92 } });
    const grossEstimate =
      valued.reduce((sum, item) => sum + item.value, 0) +
      bundle.accounts.reduce((sum, account) => sum + account.cashBalance, 0) +
      bundle.properties.reduce((sum, property) => sum + (property.currentValue * property.ownershipPct) / 100, 0);
    const debtTotal = bundle.debts.reduce((sum, debt) => sum + debt.remainingAmount, 0);

    const patrimony = computePatrimony({
      clientId: bundle.client.id,
      accounts: bundle.accounts,
      investments: valued,
      properties: bundle.properties,
      debts: bundle.debts,
      history: buildNetWorthHistory({
        clientId: bundle.client.id,
        currentGrossAssets: grossEstimate,
        currentDebt: debtTotal,
        months: 13,
        annualDriftPct: 4.5,
        volatility: 0.09,
        now,
      }),
    });

    const insights = analyzeClient({
      client: bundle.client,
      patrimony,
      accounts: bundle.accounts,
      investments: valued,
      properties: bundle.properties,
      debts: bundle.debts,
      goals: bundle.goals,
      now,
    });

    const rng = createRng(seedFrom(`alerts:${bundle.client.id}`));

    for (const item of insights.slice(0, 3)) {
      const ageDays = Math.floor(rng() * 12);
      generated.push({
        id: `alert-${item.id}`,
        firmId: bundle.client.firmId,
        clientId: bundle.client.id,
        category: KIND_TO_CATEGORY[item.kind],
        severity: SEVERITY_TO_ALERT[item.severity],
        status: 'ouverte',
        title: item.title,
        description: item.finding,
        suggestedAction: item.suggestedAction,
        assigneeId: bundle.client.advisors.find((link) => link.primary)?.advisorId ?? null,
        createdAt: new Date(now.getTime() - ageDays * 86400_000).toISOString(),
        resolvedAt: null,
        comments: [],
        ruleId: item.ruleId,
      });
    }
  }

  const alerts = [...generated, ...buildStandaloneAlerts(now)].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return {
    firms: [...DEMO_FIRMS],
    users: [...DEMO_USERS],
    clients,
    accounts,
    investments,
    properties,
    debts,
    goals,
    alerts,
    interactions: activity.interactions,
    appointments: activity.appointments,
    conversations: activity.conversations,
    messages: activity.messages,
    documents: activity.documents,
    audit: [],
    qrTokens: [],
    documentBlobs: new Map(),
    seededAt: now,
  };
}

// Le store est conservé sur `globalThis` pour survivre au rechargement à chaud
// du serveur de développement Next.js.
const globalRef = globalThis as typeof globalThis & { __patrimoniaDemoStore?: DemoStore };

export function getDemoStore(): DemoStore {
  if (!globalRef.__patrimoniaDemoStore) {
    globalRef.__patrimoniaDemoStore = seedStore();
  }
  return globalRef.__patrimoniaDemoStore;
}

/** Réinitialise l'entrepôt de démonstration (utilisé par les tests). */
export function resetDemoStore(): DemoStore {
  globalRef.__patrimoniaDemoStore = seedStore();
  return globalRef.__patrimoniaDemoStore;
}

export function nextId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Jeton opaque imprévisible, utilisé par les accès QR. */
export function randomToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function buildComment(authorId: string, authorLabel: string, body: string): AlertComment {
  return {
    id: nextId('comment'),
    authorId,
    authorLabel,
    body,
    createdAt: new Date().toISOString(),
  };
}
