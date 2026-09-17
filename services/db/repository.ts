import type {
  Alert,
  AlertStatus,
  Appointment,
  AssetAccount,
  AuditEntry,
  Client,
  ClientStatus,
  Conversation,
  Debt,
  Firm,
  Goal,
  Interaction,
  Investment,
  Message,
  RealEstateAsset,
  RiskProfile,
  StoredDocument,
  UserAccount,
  QrToken,
} from '@/types';
import type { AccessContext } from './access';

export interface ClientFilters {
  search?: string;
  status?: ClientStatus | 'tous';
  riskProfile?: RiskProfile | 'tous';
  advisorId?: string | 'tous';
  minNetWorth?: number;
  sort?: 'nom' | 'patrimoine' | 'evolution' | 'alertes' | 'recent';
}

export interface ClientRecord {
  client: Client;
  accounts: AssetAccount[];
  investments: Investment[];
  properties: RealEstateAsset[];
  debts: Debt[];
  goals: Goal[];
}

/**
 * Contrat d'accès aux données.
 *
 * Toutes les méthodes reçoivent le contexte d'accès résolu côté serveur et
 * filtrent sur le cabinet. L'implémentation Supabase s'appuie en plus sur les
 * politiques Row Level Security définies dans `supabase/migrations`.
 */
export interface Repository {
  readonly backend: 'demo' | 'supabase';

  getFirm(access: AccessContext): Promise<Firm | null>;
  updateBranding(access: AccessContext, branding: Firm['branding']): Promise<Firm>;

  listUsers(access: AccessContext): Promise<UserAccount[]>;
  getUser(access: AccessContext, userId: string): Promise<UserAccount | null>;
  setUserActive(access: AccessContext, userId: string, active: boolean): Promise<UserAccount>;

  listClients(access: AccessContext, filters?: ClientFilters): Promise<Client[]>;
  getClient(access: AccessContext, clientId: string): Promise<Client | null>;
  getClientRecord(access: AccessContext, clientId: string): Promise<ClientRecord | null>;
  createClient(access: AccessContext, input: NewClientInput): Promise<Client>;
  updateClient(access: AccessContext, clientId: string, input: Partial<NewClientInput>): Promise<Client>;
  setClientStatus(access: AccessContext, clientId: string, status: ClientStatus): Promise<Client>;

  listAlerts(access: AccessContext, filters?: { status?: AlertStatus | 'tous'; clientId?: string }): Promise<Alert[]>;
  updateAlertStatus(access: AccessContext, alertId: string, status: AlertStatus): Promise<Alert>;
  assignAlert(access: AccessContext, alertId: string, assigneeId: string | null): Promise<Alert>;
  commentAlert(access: AccessContext, alertId: string, body: string): Promise<Alert>;

  listInteractions(access: AccessContext, clientId?: string): Promise<Interaction[]>;
  createInteraction(access: AccessContext, input: NewInteractionInput): Promise<Interaction>;
  completeInteraction(access: AccessContext, interactionId: string): Promise<Interaction>;

  listAppointments(access: AccessContext, clientId?: string): Promise<Appointment[]>;
  createAppointment(access: AccessContext, input: NewAppointmentInput): Promise<Appointment>;

  listConversations(access: AccessContext): Promise<Conversation[]>;
  listMessages(access: AccessContext, conversationId: string): Promise<Message[]>;
  sendMessage(access: AccessContext, conversationId: string, body: string): Promise<Message>;

  listDocuments(access: AccessContext, clientId?: string): Promise<StoredDocument[]>;
  createDocument(access: AccessContext, input: NewDocumentInput): Promise<StoredDocument>;
  deleteDocument(access: AccessContext, documentId: string): Promise<void>;

  createGoal(access: AccessContext, input: NewGoalInput): Promise<Goal>;
  updateGoal(access: AccessContext, goalId: string, input: NewGoalInput): Promise<Goal>;
  deleteGoal(access: AccessContext, goalId: string): Promise<void>;

  createQrToken(access: AccessContext, clientId: string, scope: QrToken['scope'], ttlMinutes: number): Promise<QrToken>;
  consumeQrToken(token: string): Promise<QrToken | null>;

  listAudit(access: AccessContext, limit?: number): Promise<AuditEntry[]>;
  recordAudit(access: AccessContext, entry: NewAuditInput): Promise<AuditEntry>;
}

export interface NewClientInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  city: string;
  postalCode: string;
  profession: string;
  riskProfile: RiskProfile;
  status: ClientStatus;
  horizonYears: number;
  annualIncome: number;
  annualExpenses: number;
  taxBracketRate: number;
  primaryAdvisorId: string;
  associateAdvisorIds: string[];
  notes: string | null;
}

export interface NewGoalInput {
  clientId: string;
  kind: Goal['kind'];
  label: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  targetDate: string;
  priority: Goal['priority'];
  notes: string | null;
}

export interface NewInteractionInput {
  clientId: string;
  kind: Interaction['kind'];
  title: string;
  body: string;
  dueAt: string | null;
}

export interface NewAppointmentInput {
  clientId: string;
  kind: Appointment['kind'];
  title: string;
  startsAt: string;
  durationMin: number;
  location: string;
  notes: string | null;
}

export interface NewDocumentInput {
  clientId: string;
  kind: StoredDocument['kind'];
  name: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string | null;
  visibleToClient: boolean;
  demo: boolean;
}

export interface NewAuditInput {
  action: string;
  targetType: string;
  targetId: string | null;
  targetLabel: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}
