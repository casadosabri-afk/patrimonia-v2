import type {
  Alert,
  AlertStatus,
  Appointment,
  AuditEntry,
  Client,
  ClientStatus,
  Conversation,
  Firm,
  Interaction,
  Message,
  StoredDocument,
  UserAccount,
} from '@/types';
import { fullName } from '@/lib/utils/format';
import { assert, canAdministerFirm, canReadClient, canWriteClientData, type AccessContext } from './access';
import { buildComment, getDemoStore, nextId } from './demoStore';
import type {
  ClientFilters,
  ClientRecord,
  NewAppointmentInput,
  NewAuditInput,
  NewClientInput,
  NewDocumentInput,
  NewInteractionInput,
  Repository,
} from './repository';

/** Implémentation mémoire utilisée en MODE DÉMONSTRATION. */
export class DemoRepository implements Repository {
  readonly backend = 'demo' as const;

  private store() {
    return getDemoStore();
  }

  /** Périmètre de lecture des clients pour un contexte d'accès donné. */
  private scopedClients(access: AccessContext): Client[] {
    const clients = this.store().clients.filter((client) => client.firmId === access.firmId);
    if (access.role === 'client') {
      return clients.filter((client) => client.id === access.clientId);
    }
    return clients;
  }

  private requireClient(access: AccessContext, clientId: string): Client {
    const client = this.scopedClients(access).find((item) => item.id === clientId);
    assert(Boolean(client), "Ce dossier client n'appartient pas à votre périmètre.");
    return client as Client;
  }

  // ---------------------------------------------------------------- Cabinet
  async getFirm(access: AccessContext): Promise<Firm | null> {
    return this.store().firms.find((firm) => firm.id === access.firmId) ?? null;
  }

  async updateBranding(access: AccessContext, branding: Firm['branding']): Promise<Firm> {
    assert(canAdministerFirm(access), 'Seul un administrateur peut modifier le branding du cabinet.');
    const firm = this.store().firms.find((item) => item.id === access.firmId);
    assert(Boolean(firm));
    (firm as Firm).branding = branding;
    (firm as Firm).name = branding.firmName;
    await this.recordAudit(access, {
      action: 'branding.update',
      targetType: 'firm',
      targetId: access.firmId,
      targetLabel: branding.firmName,
    });
    return firm as Firm;
  }

  // -------------------------------------------------------------- Utilisateurs
  async listUsers(access: AccessContext): Promise<UserAccount[]> {
    assert(access.role !== 'client', 'Accès réservé au cabinet.');
    return this.store()
      .users.filter((user) => user.firmId === access.firmId)
      .sort((a, b) => a.lastName.localeCompare(b.lastName, 'fr'));
  }

  async getUser(access: AccessContext, userId: string): Promise<UserAccount | null> {
    return (
      this.store().users.find((user) => user.id === userId && user.firmId === access.firmId) ?? null
    );
  }

  async setUserActive(access: AccessContext, userId: string, active: boolean): Promise<UserAccount> {
    assert(canAdministerFirm(access), 'Seul un administrateur peut activer ou désactiver un compte.');
    const user = this.store().users.find((item) => item.id === userId && item.firmId === access.firmId);
    assert(Boolean(user), 'Utilisateur introuvable dans ce cabinet.');
    (user as UserAccount).active = active;
    await this.recordAudit(access, {
      action: active ? 'user.activate' : 'user.deactivate',
      targetType: 'user',
      targetId: userId,
      targetLabel: fullName(user as UserAccount),
    });
    return user as UserAccount;
  }

  // ------------------------------------------------------------------ Clients
  async listClients(access: AccessContext, filters: ClientFilters = {}): Promise<Client[]> {
    let clients = this.scopedClients(access);

    if (filters.search) {
      const needle = filters.search.trim().toLowerCase();
      clients = clients.filter((client) =>
        `${client.firstName} ${client.lastName} ${client.email} ${client.city}`
          .toLowerCase()
          .includes(needle),
      );
    }

    if (filters.status && filters.status !== 'tous') {
      clients = clients.filter((client) => client.status === filters.status);
    }

    if (filters.riskProfile && filters.riskProfile !== 'tous') {
      clients = clients.filter((client) => client.riskProfile === filters.riskProfile);
    }

    if (filters.advisorId && filters.advisorId !== 'tous') {
      clients = clients.filter((client) =>
        client.advisors.some((link) => link.advisorId === filters.advisorId),
      );
    }

    return clients.sort((a, b) => a.lastName.localeCompare(b.lastName, 'fr'));
  }

  async getClient(access: AccessContext, clientId: string): Promise<Client | null> {
    if (!canReadClient(access, clientId)) return null;
    return this.scopedClients(access).find((client) => client.id === clientId) ?? null;
  }

  async getClientRecord(access: AccessContext, clientId: string): Promise<ClientRecord | null> {
    const client = await this.getClient(access, clientId);
    if (!client) return null;
    const store = this.store();

    return {
      client,
      accounts: store.accounts.filter((item) => item.clientId === clientId),
      investments: store.investments.filter((item) => item.clientId === clientId),
      properties: store.properties.filter((item) => item.clientId === clientId),
      debts: store.debts.filter((item) => item.clientId === clientId),
      goals: store.goals.filter((item) => item.clientId === clientId),
    };
  }

  async createClient(access: AccessContext, input: NewClientInput): Promise<Client> {
    assert(canWriteClientData(access), 'Seul un conseiller ou un administrateur peut créer un client.');
    const now = new Date().toISOString();

    const client: Client = {
      id: nextId('client'),
      firmId: access.firmId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      birthDate: input.birthDate,
      city: input.city,
      postalCode: input.postalCode,
      profession: input.profession,
      maritalStatus: 'celibataire',
      matrimonialRegime: 'non_applicable',
      dependents: 0,
      riskProfile: input.riskProfile,
      status: input.status,
      horizonYears: input.horizonYears,
      annualIncome: input.annualIncome,
      annualExpenses: input.annualExpenses,
      taxBracketRate: input.taxBracketRate,
      advisors: [
        { advisorId: input.primaryAdvisorId, primary: true, since: now.slice(0, 10) },
        ...input.associateAdvisorIds.map((advisorId) => ({
          advisorId,
          primary: false,
          since: now.slice(0, 10),
        })),
      ],
      createdAt: now.slice(0, 10),
      lastReviewAt: null,
      profileUpdatedAt: now.slice(0, 10),
      notes: input.notes,
      avatarColor: '#4152ab',
    };

    this.store().clients.push(client);
    await this.recordAudit(access, {
      action: 'client.create',
      targetType: 'client',
      targetId: client.id,
      targetLabel: fullName(client),
    });
    return client;
  }

  async updateClient(
    access: AccessContext,
    clientId: string,
    input: Partial<NewClientInput>,
  ): Promise<Client> {
    assert(canWriteClientData(access), 'Modification réservée au cabinet.');
    const client = this.requireClient(access, clientId);

    const { primaryAdvisorId, associateAdvisorIds, ...scalars } = input;
    Object.assign(client, scalars);

    if (primaryAdvisorId) {
      client.advisors = [
        { advisorId: primaryAdvisorId, primary: true, since: client.createdAt },
        ...(associateAdvisorIds ?? [])
          .filter((advisorId) => advisorId !== primaryAdvisorId)
          .map((advisorId) => ({ advisorId, primary: false, since: client.createdAt })),
      ];
    }

    await this.recordAudit(access, {
      action: 'client.update',
      targetType: 'client',
      targetId: client.id,
      targetLabel: fullName(client),
    });
    return client;
  }

  async setClientStatus(access: AccessContext, clientId: string, status: ClientStatus): Promise<Client> {
    assert(canWriteClientData(access), 'Modification réservée au cabinet.');
    const client = this.requireClient(access, clientId);
    client.status = status;
    await this.recordAudit(access, {
      action: status === 'archive' ? 'client.archive' : 'client.status',
      targetType: 'client',
      targetId: client.id,
      targetLabel: fullName(client),
      metadata: { status },
    });
    return client;
  }

  // ------------------------------------------------------------------ Alertes
  async listAlerts(
    access: AccessContext,
    filters: { status?: AlertStatus | 'tous'; clientId?: string } = {},
  ): Promise<Alert[]> {
    const readableClientIds = new Set(this.scopedClients(access).map((client) => client.id));

    return this.store()
      .alerts.filter((alert) => {
        if (alert.firmId !== access.firmId) return false;
        if (alert.clientId && !readableClientIds.has(alert.clientId)) return false;
        if (access.role === 'client') return false;
        if (filters.clientId && alert.clientId !== filters.clientId) return false;
        if (filters.status && filters.status !== 'tous' && alert.status !== filters.status) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  private requireAlert(access: AccessContext, alertId: string): Alert {
    const alert = this.store().alerts.find(
      (item) => item.id === alertId && item.firmId === access.firmId,
    );
    assert(Boolean(alert), 'Alerte introuvable dans ce cabinet.');
    return alert as Alert;
  }

  async updateAlertStatus(access: AccessContext, alertId: string, status: AlertStatus): Promise<Alert> {
    assert(canWriteClientData(access), 'Traitement réservé au cabinet.');
    const alert = this.requireAlert(access, alertId);
    alert.status = status;
    alert.resolvedAt = status === 'traitee' || status === 'ignoree' ? new Date().toISOString() : null;
    await this.recordAudit(access, {
      action: 'alert.status',
      targetType: 'alert',
      targetId: alert.id,
      targetLabel: alert.title,
      metadata: { status },
    });
    return alert;
  }

  async assignAlert(access: AccessContext, alertId: string, assigneeId: string | null): Promise<Alert> {
    assert(canWriteClientData(access), 'Attribution réservée au cabinet.');
    const alert = this.requireAlert(access, alertId);
    alert.assigneeId = assigneeId;
    await this.recordAudit(access, {
      action: 'alert.assign',
      targetType: 'alert',
      targetId: alert.id,
      targetLabel: alert.title,
      metadata: { assigneeId },
    });
    return alert;
  }

  async commentAlert(access: AccessContext, alertId: string, body: string): Promise<Alert> {
    assert(canWriteClientData(access), 'Commentaire réservé au cabinet.');
    const alert = this.requireAlert(access, alertId);
    const author = await this.getUser(access, access.userId);
    alert.comments.push(
      buildComment(access.userId, author ? fullName(author) : 'Utilisateur', body.trim()),
    );
    if (alert.status === 'ouverte') alert.status = 'en_cours';
    return alert;
  }

  // ---------------------------------------------------------------------- CRM
  async listInteractions(access: AccessContext, clientId?: string): Promise<Interaction[]> {
    const readable = new Set(this.scopedClients(access).map((client) => client.id));
    return this.store()
      .interactions.filter((interaction) => {
        if (interaction.firmId !== access.firmId) return false;
        if (!readable.has(interaction.clientId)) return false;
        if (access.role === 'client') return false;
        if (clientId && interaction.clientId !== clientId) return false;
        return true;
      })
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  }

  async createInteraction(access: AccessContext, input: NewInteractionInput): Promise<Interaction> {
    assert(canWriteClientData(access), 'Action réservée au cabinet.');
    this.requireClient(access, input.clientId);
    const now = new Date().toISOString();

    const interaction: Interaction = {
      id: nextId('interaction'),
      firmId: access.firmId,
      clientId: input.clientId,
      advisorId: access.userId,
      kind: input.kind,
      title: input.title,
      body: input.body,
      status: input.kind === 'tache' ? 'a_faire' : 'termine',
      occurredAt: now,
      dueAt: input.dueAt,
      createdAt: now,
    };

    this.store().interactions.push(interaction);
    await this.recordAudit(access, {
      action: 'crm.interaction.create',
      targetType: 'interaction',
      targetId: interaction.id,
      targetLabel: interaction.title,
    });
    return interaction;
  }

  async completeInteraction(access: AccessContext, interactionId: string): Promise<Interaction> {
    assert(canWriteClientData(access), 'Action réservée au cabinet.');
    const interaction = this.store().interactions.find(
      (item) => item.id === interactionId && item.firmId === access.firmId,
    );
    assert(Boolean(interaction), 'Interaction introuvable.');
    (interaction as Interaction).status = 'termine';
    return interaction as Interaction;
  }

  // -------------------------------------------------------------- Rendez-vous
  async listAppointments(access: AccessContext, clientId?: string): Promise<Appointment[]> {
    const readable = new Set(this.scopedClients(access).map((client) => client.id));
    return this.store()
      .appointments.filter((appointment) => {
        if (appointment.firmId !== access.firmId) return false;
        if (!readable.has(appointment.clientId)) return false;
        if (clientId && appointment.clientId !== clientId) return false;
        return true;
      })
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }

  async createAppointment(access: AccessContext, input: NewAppointmentInput): Promise<Appointment> {
    assert(canWriteClientData(access), 'Action réservée au cabinet.');
    this.requireClient(access, input.clientId);

    const appointment: Appointment = {
      id: nextId('appointment'),
      firmId: access.firmId,
      clientId: input.clientId,
      advisorId: access.userId,
      kind: input.kind,
      title: input.title,
      startsAt: input.startsAt,
      durationMin: input.durationMin,
      location: input.location,
      status: 'planifie',
      notes: input.notes,
    };

    this.store().appointments.push(appointment);
    await this.recordAudit(access, {
      action: 'calendar.appointment.create',
      targetType: 'appointment',
      targetId: appointment.id,
      targetLabel: appointment.title,
    });
    return appointment;
  }

  // --------------------------------------------------------------- Messagerie
  async listConversations(access: AccessContext): Promise<Conversation[]> {
    const readable = new Set(this.scopedClients(access).map((client) => client.id));
    return this.store()
      .conversations.filter(
        (conversation) => conversation.firmId === access.firmId && readable.has(conversation.clientId),
      )
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async listMessages(access: AccessContext, conversationId: string): Promise<Message[]> {
    const conversations = await this.listConversations(access);
    const allowed = conversations.some((conversation) => conversation.id === conversationId);
    assert(allowed, "Cette conversation n'appartient pas à votre périmètre.");

    return this.store()
      .messages.filter((message) => message.conversationId === conversationId)
      .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
  }

  async sendMessage(access: AccessContext, conversationId: string, body: string): Promise<Message> {
    const conversations = await this.listConversations(access);
    const conversation = conversations.find((item) => item.id === conversationId);
    assert(Boolean(conversation), "Cette conversation n'appartient pas à votre périmètre.");

    const message: Message = {
      id: nextId('message'),
      firmId: access.firmId,
      conversationId,
      authorRole: access.role === 'client' ? 'client' : 'advisor',
      authorId: access.role === 'client' ? (access.clientId ?? access.userId) : access.userId,
      body: body.trim(),
      sentAt: new Date().toISOString(),
      attachmentIds: [],
    };

    this.store().messages.push(message);
    const target = conversation as Conversation;
    target.updatedAt = message.sentAt;
    if (message.authorRole === 'advisor') {
      target.unreadForClient += 1;
      target.unreadForAdvisor = 0;
    } else {
      target.unreadForAdvisor += 1;
      target.unreadForClient = 0;
    }
    return message;
  }

  // ---------------------------------------------------------------- Documents
  async listDocuments(access: AccessContext, clientId?: string): Promise<StoredDocument[]> {
    const readable = new Set(this.scopedClients(access).map((client) => client.id));
    return this.store()
      .documents.filter((document) => {
        if (document.firmId !== access.firmId) return false;
        if (!readable.has(document.clientId)) return false;
        if (access.role === 'client' && !document.visibleToClient) return false;
        if (clientId && document.clientId !== clientId) return false;
        return true;
      })
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  async createDocument(access: AccessContext, input: NewDocumentInput): Promise<StoredDocument> {
    assert(canWriteClientData(access), 'Dépôt réservé au cabinet.');
    this.requireClient(access, input.clientId);

    const document: StoredDocument = {
      id: nextId('document'),
      firmId: access.firmId,
      clientId: input.clientId,
      kind: input.kind,
      name: input.name,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      uploadedAt: new Date().toISOString(),
      uploadedBy: access.userId,
      storagePath: input.storagePath,
      demo: input.demo,
      visibleToClient: input.visibleToClient,
    };

    this.store().documents.push(document);
    await this.recordAudit(access, {
      action: 'document.create',
      targetType: 'document',
      targetId: document.id,
      targetLabel: document.name,
    });
    return document;
  }

  async deleteDocument(access: AccessContext, documentId: string): Promise<void> {
    assert(canWriteClientData(access), 'Suppression réservée au cabinet.');
    const store = this.store();
    const index = store.documents.findIndex(
      (document) => document.id === documentId && document.firmId === access.firmId,
    );
    assert(index >= 0, 'Document introuvable.');
    const [removed] = store.documents.splice(index, 1);
    await this.recordAudit(access, {
      action: 'document.delete',
      targetType: 'document',
      targetId: documentId,
      targetLabel: removed?.name ?? null,
    });
  }

  // -------------------------------------------------------------------- Audit
  async listAudit(access: AccessContext, limit = 50): Promise<AuditEntry[]> {
    assert(access.role !== 'client', 'Journal réservé au cabinet.');
    return this.store()
      .audit.filter((entry) => entry.firmId === access.firmId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async recordAudit(access: AccessContext, input: NewAuditInput): Promise<AuditEntry> {
    const user = this.store().users.find((item) => item.id === access.userId);

    const entry: AuditEntry = {
      id: nextId('audit'),
      firmId: access.firmId,
      userId: access.userId,
      userLabel: user ? fullName(user) : access.userId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      targetLabel: input.targetLabel,
      createdAt: new Date().toISOString(),
      ...(input.metadata ? { metadata: input.metadata } : {}),
    };

    this.store().audit.push(entry);
    return entry;
  }
}
