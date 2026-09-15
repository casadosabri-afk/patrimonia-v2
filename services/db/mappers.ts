import type {
  Alert,
  Appointment,
  AssetAccount,
  AuditEntry,
  Client,
  ClientAdvisorLink,
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
} from '@/types';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

const number = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === 'string' ? Number.parseFloat(value) : (value as number);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function toFirm(row: Row): Firm {
  const branding = (row.branding ?? {}) as Partial<Firm['branding']>;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.created_at,
    plan: row.plan,
    branding: {
      firmName: branding.firmName ?? row.name,
      logoUrl: branding.logoUrl ?? null,
      primaryColor: branding.primaryColor ?? '#151b3b',
      accentColor: branding.accentColor ?? '#00a97f',
      contactEmail: branding.contactEmail ?? '',
      contactPhone: branding.contactPhone ?? '',
      website: branding.website ?? null,
      reportFooter:
        branding.reportFooter ??
        'Document pédagogique généré par PATRIMONIA. Ne constitue pas un conseil en investissement.',
    },
  };
}

export function toUser(row: Row): UserAccount {
  return {
    id: row.id,
    firmId: row.firm_id,
    role: row.role,
    email: row.email,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    jobTitle: row.job_title ?? null,
    phone: row.phone ?? null,
    avatarColor: row.avatar_color ?? '#4152ab',
    active: row.active ?? true,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at ?? null,
    clientId: row.client_id ?? null,
  };
}

export function toClient(row: Row, advisors: ClientAdvisorLink[]): Client {
  return {
    id: row.id,
    firmId: row.firm_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone ?? '',
    birthDate: row.birth_date,
    city: row.city ?? '',
    postalCode: row.postal_code ?? '',
    profession: row.profession ?? '',
    maritalStatus: row.marital_status,
    matrimonialRegime: row.matrimonial_regime,
    dependents: number(row.dependents),
    riskProfile: row.risk_profile,
    status: row.status,
    horizonYears: number(row.horizon_years, 10),
    annualIncome: number(row.annual_income),
    annualExpenses: number(row.annual_expenses),
    taxBracketRate: number(row.tax_bracket_rate),
    advisors,
    createdAt: row.created_at,
    lastReviewAt: row.last_review_at ?? null,
    profileUpdatedAt: row.profile_updated_at,
    notes: row.notes ?? null,
    avatarColor: row.avatar_color ?? '#4152ab',
  };
}

export function toAdvisorLink(row: Row): ClientAdvisorLink {
  return { advisorId: row.advisor_id, primary: Boolean(row.is_primary), since: row.since };
}

export function toAccount(row: Row): AssetAccount {
  return {
    id: row.id,
    firmId: row.firm_id,
    clientId: row.client_id,
    kind: row.kind,
    label: row.label,
    institution: row.institution ?? '',
    openedAt: row.opened_at,
    cashBalance: number(row.cash_balance),
    currency: 'EUR',
  };
}

export function toInvestment(row: Row): Investment {
  return {
    id: row.id,
    firmId: row.firm_id,
    clientId: row.client_id,
    accountId: row.account_id,
    name: row.name,
    ticker: row.ticker ?? null,
    isin: row.isin ?? null,
    type: row.type,
    assetClass: row.asset_class,
    sector: row.sector ?? '',
    region: row.region ?? '',
    quantity: number(row.quantity),
    averageCost: number(row.average_cost),
    fallbackPrice: number(row.fallback_price),
    currency: row.currency === 'USD' ? 'USD' : 'EUR',
    purchasedAt: row.purchased_at,
  };
}

export function toProperty(row: Row): RealEstateAsset {
  return {
    id: row.id,
    firmId: row.firm_id,
    clientId: row.client_id,
    label: row.label,
    kind: row.kind,
    city: row.city ?? '',
    postalCode: row.postal_code ?? '',
    surfaceM2: number(row.surface_m2),
    purchasePrice: number(row.purchase_price),
    currentValue: number(row.current_value),
    purchasedAt: row.purchased_at,
    monthlyRent: number(row.monthly_rent),
    monthlyCharges: number(row.monthly_charges),
    annualPropertyTax: number(row.annual_property_tax),
    ownershipPct: number(row.ownership_pct, 100),
    linkedDebtId: row.linked_debt_id ?? null,
  };
}

export function toDebt(row: Row): Debt {
  return {
    id: row.id,
    firmId: row.firm_id,
    clientId: row.client_id,
    label: row.label,
    kind: row.kind,
    lender: row.lender ?? '',
    initialAmount: number(row.initial_amount),
    remainingAmount: number(row.remaining_amount),
    annualRatePct: number(row.annual_rate_pct),
    insuranceRatePct: number(row.insurance_rate_pct),
    monthlyPayment: number(row.monthly_payment),
    startedAt: row.started_at,
    endsAt: row.ends_at,
  };
}

export function toGoal(row: Row): Goal {
  return {
    id: row.id,
    firmId: row.firm_id,
    clientId: row.client_id,
    kind: row.kind,
    label: row.label,
    targetAmount: number(row.target_amount),
    currentAmount: number(row.current_amount),
    monthlyContribution: number(row.monthly_contribution),
    targetDate: row.target_date,
    priority: row.priority,
    createdAt: row.created_at,
    notes: row.notes ?? null,
  };
}

export function toAlert(row: Row): Alert {
  return {
    id: row.id,
    firmId: row.firm_id,
    clientId: row.client_id ?? null,
    category: row.category,
    severity: row.severity,
    status: row.status,
    title: row.title,
    description: row.description ?? '',
    suggestedAction: row.suggested_action ?? '',
    assigneeId: row.assignee_id ?? null,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at ?? null,
    comments: Array.isArray(row.comments) ? row.comments : [],
    ruleId: row.rule_id ?? null,
  };
}

export function toInteraction(row: Row): Interaction {
  return {
    id: row.id,
    firmId: row.firm_id,
    clientId: row.client_id,
    advisorId: row.advisor_id,
    kind: row.kind,
    title: row.title,
    body: row.body ?? '',
    status: row.status,
    occurredAt: row.occurred_at,
    dueAt: row.due_at ?? null,
    createdAt: row.created_at,
  };
}

export function toAppointment(row: Row): Appointment {
  return {
    id: row.id,
    firmId: row.firm_id,
    clientId: row.client_id,
    advisorId: row.advisor_id,
    kind: row.kind,
    title: row.title,
    startsAt: row.starts_at,
    durationMin: number(row.duration_min, 60),
    location: row.location ?? '',
    status: row.status,
    notes: row.notes ?? null,
  };
}

export function toConversation(row: Row): Conversation {
  return {
    id: row.id,
    firmId: row.firm_id,
    clientId: row.client_id,
    advisorId: row.advisor_id,
    subject: row.subject ?? '',
    updatedAt: row.updated_at,
    unreadForAdvisor: number(row.unread_for_advisor),
    unreadForClient: number(row.unread_for_client),
  };
}

export function toMessage(row: Row): Message {
  return {
    id: row.id,
    firmId: row.firm_id,
    conversationId: row.conversation_id,
    authorRole: row.author_role,
    authorId: row.author_id,
    body: row.body,
    sentAt: row.sent_at,
    attachmentIds: row.attachment_ids ?? [],
  };
}

export function toDocument(row: Row): StoredDocument {
  return {
    id: row.id,
    firmId: row.firm_id,
    clientId: row.client_id,
    kind: row.kind,
    name: row.name,
    mimeType: row.mime_type ?? 'application/octet-stream',
    sizeBytes: number(row.size_bytes),
    uploadedAt: row.uploaded_at,
    uploadedBy: row.uploaded_by,
    storagePath: row.storage_path ?? null,
    demo: Boolean(row.demo),
    visibleToClient: row.visible_to_client ?? true,
  };
}

export function toAudit(row: Row): AuditEntry {
  return {
    id: row.id,
    firmId: row.firm_id,
    userId: row.user_id,
    userLabel: row.user_label ?? '',
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id ?? null,
    targetLabel: row.target_label ?? null,
    createdAt: row.created_at,
    ...(row.metadata ? { metadata: row.metadata } : {}),
  };
}
