import 'server-only';

import type {
  Alert,
  AlertStatus,
  Appointment,
  AuditEntry,
  Client,
  ClientAdvisorLink,
  ClientStatus,
  Conversation,
  Firm,
  Interaction,
  Message,
  StoredDocument,
  UserAccount,
  QrToken,
} from '@/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { fullName } from '@/lib/utils/format';
import { assert, canAdministerFirm, canReadClient, canWriteClientData, type AccessContext } from './access';
import * as map from './mappers';
import { randomToken } from './demoStore';
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

/**
 * Implémentation Supabase / PostgreSQL.
 *
 * Les filtres `firm_id` posés ici constituent une deuxième barrière : la
 * première est la Row Level Security de la base, qui s'applique même si une
 * requête oubliait un filtre.
 */
export class SupabaseRepository implements Repository {
  readonly backend = 'supabase' as const;

  private async client(): Promise<SupabaseClient> {
    const supabase = await getSupabaseServerClient();
    if (!supabase) throw new Error('Supabase n’est pas configuré.');
    return supabase;
  }

  private async advisorsByClient(
    supabase: SupabaseClient,
    access: AccessContext,
    clientIds: string[],
  ): Promise<Map<string, ClientAdvisorLink[]>> {
    const result = new Map<string, ClientAdvisorLink[]>();
    if (clientIds.length === 0) return result;

    const { data } = await supabase
      .from('client_advisors')
      .select('client_id, advisor_id, is_primary, since')
      .eq('firm_id', access.firmId)
      .in('client_id', clientIds);

    for (const row of data ?? []) {
      const list = result.get(row.client_id) ?? [];
      list.push(map.toAdvisorLink(row));
      result.set(row.client_id, list);
    }

    for (const [clientId, links] of result) {
      result.set(
        clientId,
        links.sort((a, b) => Number(b.primary) - Number(a.primary)),
      );
    }

    return result;
  }

  // ---------------------------------------------------------------- Cabinet
  async getFirm(access: AccessContext): Promise<Firm | null> {
    const supabase = await this.client();
    const { data } = await supabase.from('firms').select('*').eq('id', access.firmId).single();
    return data ? map.toFirm(data) : null;
  }

  async updateBranding(access: AccessContext, branding: Firm['branding']): Promise<Firm> {
    assert(canAdministerFirm(access), 'Seul un administrateur peut modifier le branding du cabinet.');
    const supabase = await this.client();

    const { data, error } = await supabase
      .from('firms')
      .update({ branding, name: branding.firmName })
      .eq('id', access.firmId)
      .select('*')
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Mise à jour du cabinet impossible.');
    await this.recordAudit(access, {
      action: 'branding.update',
      targetType: 'firm',
      targetId: access.firmId,
      targetLabel: branding.firmName,
    });
    return map.toFirm(data);
  }

  // ------------------------------------------------------------ Utilisateurs
  async listUsers(access: AccessContext): Promise<UserAccount[]> {
    assert(access.role !== 'client', 'Accès réservé au cabinet.');
    const supabase = await this.client();
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('firm_id', access.firmId)
      .order('last_name');
    return (data ?? []).map(map.toUser);
  }

  async getUser(access: AccessContext, userId: string): Promise<UserAccount | null> {
    const supabase = await this.client();
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .eq('firm_id', access.firmId)
      .maybeSingle();
    return data ? map.toUser(data) : null;
  }

  async setUserActive(access: AccessContext, userId: string, active: boolean): Promise<UserAccount> {
    assert(canAdministerFirm(access), 'Seul un administrateur peut activer ou désactiver un compte.');
    const supabase = await this.client();

    const { data, error } = await supabase
      .from('profiles')
      .update({ active })
      .eq('id', userId)
      .eq('firm_id', access.firmId)
      .select('*')
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Utilisateur introuvable.');
    const user = map.toUser(data);
    await this.recordAudit(access, {
      action: active ? 'user.activate' : 'user.deactivate',
      targetType: 'user',
      targetId: userId,
      targetLabel: fullName(user),
    });
    return user;
  }

  // ------------------------------------------------------------------ Clients
  async listClients(access: AccessContext, filters: ClientFilters = {}): Promise<Client[]> {
    const supabase = await this.client();
    let query = supabase.from('clients').select('*').eq('firm_id', access.firmId);

    if (access.role === 'client') query = query.eq('id', access.clientId ?? '');
    if (filters.status && filters.status !== 'tous') query = query.eq('status', filters.status);
    if (filters.riskProfile && filters.riskProfile !== 'tous') {
      query = query.eq('risk_profile', filters.riskProfile);
    }
    if (filters.search) {
      const needle = `%${filters.search.trim()}%`;
      query = query.or(
        `first_name.ilike.${needle},last_name.ilike.${needle},email.ilike.${needle},city.ilike.${needle}`,
      );
    }

    const { data } = await query.order('last_name');
    const rows = data ?? [];
    const advisors = await this.advisorsByClient(
      supabase,
      access,
      rows.map((row) => row.id),
    );

    const clients = rows.map((row) => map.toClient(row, advisors.get(row.id) ?? []));

    if (filters.advisorId && filters.advisorId !== 'tous') {
      return clients.filter((client) =>
        client.advisors.some((link) => link.advisorId === filters.advisorId),
      );
    }
    return clients;
  }

  async getClient(access: AccessContext, clientId: string): Promise<Client | null> {
    if (!canReadClient(access, clientId)) return null;
    const supabase = await this.client();

    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('firm_id', access.firmId)
      .maybeSingle();

    if (!data) return null;
    const advisors = await this.advisorsByClient(supabase, access, [clientId]);
    return map.toClient(data, advisors.get(clientId) ?? []);
  }

  async getClientRecord(access: AccessContext, clientId: string): Promise<ClientRecord | null> {
    const client = await this.getClient(access, clientId);
    if (!client) return null;
    const supabase = await this.client();

    const [accounts, investments, properties, debts, goals] = await Promise.all([
      supabase.from('asset_accounts').select('*').eq('client_id', clientId),
      supabase.from('investments').select('*').eq('client_id', clientId),
      supabase.from('real_estate_assets').select('*').eq('client_id', clientId),
      supabase.from('debts').select('*').eq('client_id', clientId),
      supabase.from('goals').select('*').eq('client_id', clientId),
    ]);

    return {
      client,
      accounts: (accounts.data ?? []).map(map.toAccount),
      investments: (investments.data ?? []).map(map.toInvestment),
      properties: (properties.data ?? []).map(map.toProperty),
      debts: (debts.data ?? []).map(map.toDebt),
      goals: (goals.data ?? []).map(map.toGoal),
    };
  }

  async createClient(access: AccessContext, input: NewClientInput): Promise<Client> {
    assert(canWriteClientData(access), 'Création réservée au cabinet.');
    const supabase = await this.client();

    const { data, error } = await supabase
      .from('clients')
      .insert({
        firm_id: access.firmId,
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        phone: input.phone,
        birth_date: input.birthDate,
        city: input.city,
        postal_code: input.postalCode,
        profession: input.profession,
        risk_profile: input.riskProfile,
        status: input.status,
        horizon_years: input.horizonYears,
        annual_income: input.annualIncome,
        annual_expenses: input.annualExpenses,
        tax_bracket_rate: input.taxBracketRate,
        notes: input.notes,
      })
      .select('*')
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Création du client impossible.');

    const links = [
      { client_id: data.id, advisor_id: input.primaryAdvisorId, firm_id: access.firmId, is_primary: true },
      ...input.associateAdvisorIds
        .filter((advisorId) => advisorId !== input.primaryAdvisorId)
        .map((advisorId) => ({
          client_id: data.id,
          advisor_id: advisorId,
          firm_id: access.firmId,
          is_primary: false,
        })),
    ];
    await supabase.from('client_advisors').insert(links);

    const client = map.toClient(
      data,
      links.map((link) => ({
        advisorId: link.advisor_id,
        primary: link.is_primary,
        since: data.created_at,
      })),
    );

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
    const supabase = await this.client();

    const patch: Record<string, unknown> = {};
    const assign = (key: string, value: unknown) => {
      if (value !== undefined) patch[key] = value;
    };

    assign('first_name', input.firstName);
    assign('last_name', input.lastName);
    assign('email', input.email);
    assign('phone', input.phone);
    assign('birth_date', input.birthDate);
    assign('city', input.city);
    assign('postal_code', input.postalCode);
    assign('profession', input.profession);
    assign('risk_profile', input.riskProfile);
    assign('status', input.status);
    assign('horizon_years', input.horizonYears);
    assign('annual_income', input.annualIncome);
    assign('annual_expenses', input.annualExpenses);
    assign('tax_bracket_rate', input.taxBracketRate);
    assign('notes', input.notes);

    if (Object.keys(patch).length > 0) {
      await supabase.from('clients').update(patch).eq('id', clientId).eq('firm_id', access.firmId);
    }

    if (input.primaryAdvisorId) {
      await supabase.from('client_advisors').delete().eq('client_id', clientId);
      await supabase.from('client_advisors').insert([
        { client_id: clientId, advisor_id: input.primaryAdvisorId, firm_id: access.firmId, is_primary: true },
        ...(input.associateAdvisorIds ?? [])
          .filter((advisorId) => advisorId !== input.primaryAdvisorId)
          .map((advisorId) => ({
            client_id: clientId,
            advisor_id: advisorId,
            firm_id: access.firmId,
            is_primary: false,
          })),
      ]);
    }

    const client = await this.getClient(access, clientId);
    if (!client) throw new Error('Client introuvable.');
    await this.recordAudit(access, {
      action: 'client.update',
      targetType: 'client',
      targetId: clientId,
      targetLabel: fullName(client),
    });
    return client;
  }

  async setClientStatus(access: AccessContext, clientId: string, status: ClientStatus): Promise<Client> {
    assert(canWriteClientData(access), 'Modification réservée au cabinet.');
    const supabase = await this.client();
    await supabase.from('clients').update({ status }).eq('id', clientId).eq('firm_id', access.firmId);

    const client = await this.getClient(access, clientId);
    if (!client) throw new Error('Client introuvable.');
    await this.recordAudit(access, {
      action: status === 'archive' ? 'client.archive' : 'client.status',
      targetType: 'client',
      targetId: clientId,
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
    if (access.role === 'client') return [];
    const supabase = await this.client();

    let query = supabase.from('alerts').select('*').eq('firm_id', access.firmId);
    if (filters.status && filters.status !== 'tous') query = query.eq('status', filters.status);
    if (filters.clientId) query = query.eq('client_id', filters.clientId);

    const { data } = await query.order('created_at', { ascending: false });
    return (data ?? []).map(map.toAlert);
  }

  private async updateAlert(
    access: AccessContext,
    alertId: string,
    patch: Record<string, unknown>,
  ): Promise<Alert> {
    const supabase = await this.client();
    const { data, error } = await supabase
      .from('alerts')
      .update(patch)
      .eq('id', alertId)
      .eq('firm_id', access.firmId)
      .select('*')
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Alerte introuvable.');
    return map.toAlert(data);
  }

  async updateAlertStatus(access: AccessContext, alertId: string, status: AlertStatus): Promise<Alert> {
    assert(canWriteClientData(access), 'Traitement réservé au cabinet.');
    const alert = await this.updateAlert(access, alertId, {
      status,
      resolved_at: status === 'traitee' || status === 'ignoree' ? new Date().toISOString() : null,
    });
    await this.recordAudit(access, {
      action: 'alert.status',
      targetType: 'alert',
      targetId: alertId,
      targetLabel: alert.title,
      metadata: { status },
    });
    return alert;
  }

  async assignAlert(access: AccessContext, alertId: string, assigneeId: string | null): Promise<Alert> {
    assert(canWriteClientData(access), 'Attribution réservée au cabinet.');
    const alert = await this.updateAlert(access, alertId, { assignee_id: assigneeId });
    await this.recordAudit(access, {
      action: 'alert.assign',
      targetType: 'alert',
      targetId: alertId,
      targetLabel: alert.title,
      metadata: { assigneeId },
    });
    return alert;
  }

  async commentAlert(access: AccessContext, alertId: string, body: string): Promise<Alert> {
    assert(canWriteClientData(access), 'Commentaire réservé au cabinet.');
    const supabase = await this.client();

    const { data } = await supabase
      .from('alerts')
      .select('comments, status')
      .eq('id', alertId)
      .eq('firm_id', access.firmId)
      .single();

    const author = await this.getUser(access, access.userId);
    const comments = Array.isArray(data?.comments) ? data.comments : [];
    comments.push({
      id: crypto.randomUUID(),
      authorId: access.userId,
      authorLabel: author ? fullName(author) : 'Utilisateur',
      body: body.trim(),
      createdAt: new Date().toISOString(),
    });

    return this.updateAlert(access, alertId, {
      comments,
      status: data?.status === 'ouverte' ? 'en_cours' : data?.status,
    });
  }

  // ---------------------------------------------------------------------- CRM
  async listInteractions(access: AccessContext, clientId?: string): Promise<Interaction[]> {
    if (access.role === 'client') return [];
    const supabase = await this.client();

    let query = supabase.from('interactions').select('*').eq('firm_id', access.firmId);
    if (clientId) query = query.eq('client_id', clientId);

    const { data } = await query.order('occurred_at', { ascending: false });
    return (data ?? []).map(map.toInteraction);
  }

  async createInteraction(access: AccessContext, input: NewInteractionInput): Promise<Interaction> {
    assert(canWriteClientData(access), 'Action réservée au cabinet.');
    const supabase = await this.client();

    const { data, error } = await supabase
      .from('interactions')
      .insert({
        firm_id: access.firmId,
        client_id: input.clientId,
        advisor_id: access.userId,
        kind: input.kind,
        title: input.title,
        body: input.body,
        status: input.kind === 'tache' ? 'a_faire' : 'termine',
        due_at: input.dueAt,
      })
      .select('*')
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Création impossible.');
    const interaction = map.toInteraction(data);
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
    const supabase = await this.client();

    const { data, error } = await supabase
      .from('interactions')
      .update({ status: 'termine' })
      .eq('id', interactionId)
      .eq('firm_id', access.firmId)
      .select('*')
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Interaction introuvable.');
    return map.toInteraction(data);
  }

  // -------------------------------------------------------------- Rendez-vous
  async listAppointments(access: AccessContext, clientId?: string): Promise<Appointment[]> {
    const supabase = await this.client();
    let query = supabase.from('appointments').select('*').eq('firm_id', access.firmId);
    if (clientId) query = query.eq('client_id', clientId);
    if (access.role === 'client') query = query.eq('client_id', access.clientId ?? '');

    const { data } = await query.order('starts_at');
    return (data ?? []).map(map.toAppointment);
  }

  async createAppointment(access: AccessContext, input: NewAppointmentInput): Promise<Appointment> {
    assert(canWriteClientData(access), 'Action réservée au cabinet.');
    const supabase = await this.client();

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        firm_id: access.firmId,
        client_id: input.clientId,
        advisor_id: access.userId,
        kind: input.kind,
        title: input.title,
        starts_at: input.startsAt,
        duration_min: input.durationMin,
        location: input.location,
        notes: input.notes,
      })
      .select('*')
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Création impossible.');
    const appointment = map.toAppointment(data);
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
    const supabase = await this.client();
    let query = supabase.from('conversations').select('*').eq('firm_id', access.firmId);
    if (access.role === 'client') query = query.eq('client_id', access.clientId ?? '');

    const { data } = await query.order('updated_at', { ascending: false });
    return (data ?? []).map(map.toConversation);
  }

  async listMessages(access: AccessContext, conversationId: string): Promise<Message[]> {
    const conversations = await this.listConversations(access);
    assert(
      conversations.some((conversation) => conversation.id === conversationId),
      "Cette conversation n'appartient pas à votre périmètre.",
    );

    const supabase = await this.client();
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('sent_at');
    return (data ?? []).map(map.toMessage);
  }

  async sendMessage(access: AccessContext, conversationId: string, body: string): Promise<Message> {
    const conversations = await this.listConversations(access);
    const conversation = conversations.find((item) => item.id === conversationId);
    assert(Boolean(conversation), "Cette conversation n'appartient pas à votre périmètre.");

    const supabase = await this.client();
    const authorRole = access.role === 'client' ? 'client' : 'advisor';

    const { data, error } = await supabase
      .from('messages')
      .insert({
        firm_id: access.firmId,
        conversation_id: conversationId,
        author_role: authorRole,
        author_id: access.role === 'client' ? (access.clientId ?? access.userId) : access.userId,
        body: body.trim(),
      })
      .select('*')
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Envoi impossible.');

    await supabase
      .from('conversations')
      .update({
        updated_at: new Date().toISOString(),
        unread_for_client:
          authorRole === 'advisor' ? (conversation?.unreadForClient ?? 0) + 1 : 0,
        unread_for_advisor:
          authorRole === 'client' ? (conversation?.unreadForAdvisor ?? 0) + 1 : 0,
      })
      .eq('id', conversationId);

    return map.toMessage(data);
  }

  // ---------------------------------------------------------------- Documents
  async listDocuments(access: AccessContext, clientId?: string): Promise<StoredDocument[]> {
    const supabase = await this.client();
    let query = supabase.from('documents').select('*').eq('firm_id', access.firmId);
    if (clientId) query = query.eq('client_id', clientId);
    if (access.role === 'client') {
      query = query.eq('client_id', access.clientId ?? '').eq('visible_to_client', true);
    }

    const { data } = await query.order('uploaded_at', { ascending: false });
    return (data ?? []).map(map.toDocument);
  }

  async createDocument(access: AccessContext, input: NewDocumentInput): Promise<StoredDocument> {
    assert(canWriteClientData(access), 'Dépôt réservé au cabinet.');
    const supabase = await this.client();

    const { data, error } = await supabase
      .from('documents')
      .insert({
        firm_id: access.firmId,
        client_id: input.clientId,
        kind: input.kind,
        name: input.name,
        mime_type: input.mimeType,
        size_bytes: input.sizeBytes,
        storage_path: input.storagePath,
        demo: input.demo,
        visible_to_client: input.visibleToClient,
        uploaded_by: access.userId,
      })
      .select('*')
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Dépôt impossible.');
    const document = map.toDocument(data);
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
    const supabase = await this.client();

    const { data } = await supabase
      .from('documents')
      .select('name, storage_path')
      .eq('id', documentId)
      .eq('firm_id', access.firmId)
      .maybeSingle();

    if (data?.storage_path) {
      await supabase.storage.from('client-documents').remove([data.storage_path]);
    }

    await supabase.from('documents').delete().eq('id', documentId).eq('firm_id', access.firmId);
    await this.recordAudit(access, {
      action: 'document.delete',
      targetType: 'document',
      targetId: documentId,
      targetLabel: data?.name ?? null,
    });
  }

  // ---------------------------------------------------------------- Accès QR
  async createQrToken(
    access: AccessContext,
    clientId: string,
    scope: QrToken['scope'],
    ttlMinutes: number,
  ): Promise<QrToken> {
    assert(canWriteClientData(access), 'Génération réservée au cabinet.');
    const supabase = await this.client();
    const now = new Date();
    const token = randomToken();

    const { data, error } = await supabase
      .from('qr_tokens')
      .insert({
        token,
        firm_id: access.firmId,
        client_id: clientId,
        created_by: access.userId,
        scope,
        expires_at: new Date(now.getTime() + ttlMinutes * 60_000).toISOString(),
      })
      .select('*')
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Génération du jeton impossible.');

    await this.recordAudit(access, {
      action: 'qr.create',
      targetType: 'client',
      targetId: clientId,
      targetLabel: null,
      metadata: { scope, ttlMinutes },
    });

    return {
      token: data.token,
      firmId: data.firm_id,
      clientId: data.client_id,
      createdBy: data.created_by,
      scope: data.scope,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
      usedAt: data.used_at ?? null,
    };
  }

  async consumeQrToken(token: string): Promise<QrToken | null> {
    const supabase = await this.client();

    const { data } = await supabase
      .from('qr_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .select('*')
      .maybeSingle();

    if (!data) return null;
    return {
      token: data.token,
      firmId: data.firm_id,
      clientId: data.client_id,
      createdBy: data.created_by,
      scope: data.scope,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
      usedAt: data.used_at ?? null,
    };
  }

  // -------------------------------------------------------------------- Audit
  async listAudit(access: AccessContext, limit = 50): Promise<AuditEntry[]> {
    assert(access.role !== 'client', 'Journal réservé au cabinet.');
    const supabase = await this.client();

    const { data } = await supabase
      .from('audit_log')
      .select('*')
      .eq('firm_id', access.firmId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data ?? []).map(map.toAudit);
  }

  async recordAudit(access: AccessContext, input: NewAuditInput): Promise<AuditEntry> {
    const supabase = await this.client();
    const user = await this.getUser(access, access.userId);

    const { data, error } = await supabase
      .from('audit_log')
      .insert({
        firm_id: access.firmId,
        user_id: access.userId,
        user_label: user ? fullName(user) : access.userId,
        action: input.action,
        target_type: input.targetType,
        target_id: input.targetId,
        target_label: input.targetLabel,
        metadata: input.metadata ?? null,
      })
      .select('*')
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Écriture du journal impossible.');
    return map.toAudit(data);
  }
}
