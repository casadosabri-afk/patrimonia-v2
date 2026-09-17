/**
 * Amorçage d'une base Supabase avec le jeu de démonstration PATRIMONIA.
 *
 * ⚠️ Ce script utilise la clé de service, qui contourne les politiques Row Level
 * Security. Il s'exécute uniquement en local ou dans une chaîne d'intégration,
 * jamais depuis le navigateur.
 *
 * Lancement : `SUPABASE_SERVICE_ROLE_KEY=... npm run seed:supabase`
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { DEMO_FIRMS, DEMO_USERS } from '@/data/demo/people';
import { buildAllBundles, buildStandaloneAlerts } from '@/data/demo/build';
import { buildActivity } from '@/data/demo/activity';
import { DEMO_PASSWORD } from '@/lib/auth/demoAccounts';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    'Variables manquantes. Renseignez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY avant de lancer ce script.',
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Identifiants UUID stables dérivés des identifiants du jeu de démonstration. */
const idMap = new Map<string, string>();

function uuidFor(key: string): string {
  const existing = idMap.get(key);
  if (existing) return existing;
  const value = crypto.randomUUID();
  idMap.set(key, value);
  return value;
}

async function insert(client: SupabaseClient, table: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;

  // Insertion par lots pour rester sous les limites de la passerelle.
  for (let index = 0; index < rows.length; index += 200) {
    const chunk = rows.slice(index, index + 200);
    const { error } = await client.from(table).upsert(chunk, { onConflict: 'id' });
    if (error) throw new Error(`Insertion dans ${table} impossible : ${error.message}`);
  }
  console.log(`  ${table} : ${rows.length} ligne(s)`);
}

async function main() {
  const now = new Date();
  const bundles = buildAllBundles(now);
  const activity = buildActivity(now);

  console.log('Amorçage du jeu de démonstration PATRIMONIA.\n');

  // 1. Cabinets -------------------------------------------------------------
  console.log('Cabinets');
  await insert(
    supabase,
    'firms',
    DEMO_FIRMS.map((firm) => ({
      id: uuidFor(firm.id),
      name: firm.name,
      slug: firm.slug,
      plan: firm.plan,
      branding: firm.branding,
    })),
  );

  // 2. Clients --------------------------------------------------------------
  console.log('Clients');
  await insert(
    supabase,
    'clients',
    bundles.map(({ client }) => ({
      id: uuidFor(client.id),
      firm_id: uuidFor(client.firmId),
      first_name: client.firstName,
      last_name: client.lastName,
      email: client.email,
      phone: client.phone,
      birth_date: client.birthDate,
      city: client.city,
      postal_code: client.postalCode,
      profession: client.profession,
      marital_status: client.maritalStatus,
      matrimonial_regime: client.matrimonialRegime,
      dependents: client.dependents,
      risk_profile: client.riskProfile,
      status: client.status,
      horizon_years: client.horizonYears,
      annual_income: client.annualIncome,
      annual_expenses: client.annualExpenses,
      tax_bracket_rate: client.taxBracketRate,
      created_at: client.createdAt,
      last_review_at: client.lastReviewAt,
      profile_updated_at: client.profileUpdatedAt,
      notes: client.notes,
      avatar_color: client.avatarColor,
    })),
  );

  // 3. Comptes d'authentification et profils --------------------------------
  console.log('Comptes utilisateurs');
  for (const user of DEMO_USERS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
    });

    if (error && !error.message.toLowerCase().includes('already')) {
      throw new Error(`Création du compte ${user.email} impossible : ${error.message}`);
    }

    let authId = data?.user?.id;

    if (!authId) {
      const { data: existing } = await supabase.auth.admin.listUsers();
      authId = existing?.users.find((item) => item.email === user.email)?.id;
    }

    if (!authId) throw new Error(`Identifiant introuvable pour ${user.email}.`);
    idMap.set(user.id, authId);
  }

  await insert(
    supabase,
    'profiles',
    DEMO_USERS.map((user) => ({
      id: uuidFor(user.id),
      firm_id: uuidFor(user.firmId),
      role: user.role,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      job_title: user.jobTitle,
      phone: user.phone,
      avatar_color: user.avatarColor,
      active: user.active,
      client_id: user.clientId ? uuidFor(user.clientId) : null,
    })),
  );

  // 4. Rattachement des conseillers -----------------------------------------
  console.log('Rattachement des conseillers');
  const { error: linkError } = await supabase.from('client_advisors').upsert(
    bundles.flatMap(({ client }) =>
      client.advisors.map((link) => ({
        client_id: uuidFor(client.id),
        advisor_id: uuidFor(link.advisorId),
        firm_id: uuidFor(client.firmId),
        is_primary: link.primary,
        since: link.since,
      })),
    ),
    { onConflict: 'client_id,advisor_id' },
  );
  if (linkError) throw new Error(`Rattachement impossible : ${linkError.message}`);

  // 5. Patrimoine -----------------------------------------------------------
  console.log('Patrimoine');
  await insert(
    supabase,
    'asset_accounts',
    bundles.flatMap((bundle) =>
      bundle.accounts.map((account) => ({
        id: uuidFor(account.id),
        firm_id: uuidFor(account.firmId),
        client_id: uuidFor(account.clientId),
        kind: account.kind,
        label: account.label,
        institution: account.institution,
        opened_at: account.openedAt,
        cash_balance: account.cashBalance,
        currency: account.currency,
      })),
    ),
  );

  await insert(
    supabase,
    'investments',
    bundles.flatMap((bundle) =>
      bundle.investments.map((investment) => ({
        id: uuidFor(investment.id),
        firm_id: uuidFor(investment.firmId),
        client_id: uuidFor(investment.clientId),
        account_id: uuidFor(investment.accountId),
        name: investment.name,
        ticker: investment.ticker,
        isin: investment.isin,
        type: investment.type,
        asset_class: investment.assetClass,
        sector: investment.sector,
        region: investment.region,
        quantity: investment.quantity,
        average_cost: investment.averageCost,
        fallback_price: investment.fallbackPrice,
        currency: investment.currency,
        purchased_at: investment.purchasedAt,
      })),
    ),
  );

  await insert(
    supabase,
    'debts',
    bundles.flatMap((bundle) =>
      bundle.debts.map((debt) => ({
        id: uuidFor(debt.id),
        firm_id: uuidFor(debt.firmId),
        client_id: uuidFor(debt.clientId),
        label: debt.label,
        kind: debt.kind,
        lender: debt.lender,
        initial_amount: debt.initialAmount,
        remaining_amount: debt.remainingAmount,
        annual_rate_pct: debt.annualRatePct,
        insurance_rate_pct: debt.insuranceRatePct,
        monthly_payment: debt.monthlyPayment,
        started_at: debt.startedAt,
        ends_at: debt.endsAt,
      })),
    ),
  );

  await insert(
    supabase,
    'real_estate_assets',
    bundles.flatMap((bundle) =>
      bundle.properties.map((property) => ({
        id: uuidFor(property.id),
        firm_id: uuidFor(property.firmId),
        client_id: uuidFor(property.clientId),
        label: property.label,
        kind: property.kind,
        city: property.city,
        postal_code: property.postalCode,
        surface_m2: property.surfaceM2,
        purchase_price: property.purchasePrice,
        current_value: property.currentValue,
        purchased_at: property.purchasedAt,
        monthly_rent: property.monthlyRent,
        monthly_charges: property.monthlyCharges,
        annual_property_tax: property.annualPropertyTax,
        ownership_pct: property.ownershipPct,
        linked_debt_id: property.linkedDebtId ? uuidFor(property.linkedDebtId) : null,
      })),
    ),
  );

  await insert(
    supabase,
    'goals',
    bundles.flatMap((bundle) =>
      bundle.goals.map((goal) => ({
        id: uuidFor(goal.id),
        firm_id: uuidFor(goal.firmId),
        client_id: uuidFor(goal.clientId),
        kind: goal.kind,
        label: goal.label,
        target_amount: goal.targetAmount,
        current_amount: goal.currentAmount,
        monthly_contribution: goal.monthlyContribution,
        target_date: goal.targetDate,
        priority: goal.priority,
        created_at: goal.createdAt,
        notes: goal.notes,
      })),
    ),
  );

  // 6. Relation client ------------------------------------------------------
  console.log('Relation client');
  await insert(
    supabase,
    'interactions',
    activity.interactions.map((interaction) => ({
      id: uuidFor(interaction.id),
      firm_id: uuidFor(interaction.firmId),
      client_id: uuidFor(interaction.clientId),
      advisor_id: uuidFor(interaction.advisorId),
      kind: interaction.kind,
      title: interaction.title,
      body: interaction.body,
      status: interaction.status,
      occurred_at: interaction.occurredAt,
      due_at: interaction.dueAt,
      created_at: interaction.createdAt,
    })),
  );

  await insert(
    supabase,
    'appointments',
    activity.appointments.map((appointment) => ({
      id: uuidFor(appointment.id),
      firm_id: uuidFor(appointment.firmId),
      client_id: uuidFor(appointment.clientId),
      advisor_id: uuidFor(appointment.advisorId),
      kind: appointment.kind,
      title: appointment.title,
      starts_at: appointment.startsAt,
      duration_min: appointment.durationMin,
      location: appointment.location,
      status: appointment.status,
      notes: appointment.notes,
    })),
  );

  await insert(
    supabase,
    'conversations',
    activity.conversations.map((conversation) => ({
      id: uuidFor(conversation.id),
      firm_id: uuidFor(conversation.firmId),
      client_id: uuidFor(conversation.clientId),
      advisor_id: uuidFor(conversation.advisorId),
      subject: conversation.subject,
      updated_at: conversation.updatedAt,
      unread_for_advisor: conversation.unreadForAdvisor,
      unread_for_client: conversation.unreadForClient,
    })),
  );

  await insert(
    supabase,
    'messages',
    activity.messages.map((message) => ({
      id: uuidFor(message.id),
      firm_id: uuidFor(message.firmId),
      conversation_id: uuidFor(message.conversationId),
      author_role: message.authorRole,
      author_id: uuidFor(message.authorId),
      body: message.body,
      sent_at: message.sentAt,
    })),
  );

  await insert(
    supabase,
    'documents',
    activity.documents.map((document) => ({
      id: uuidFor(document.id),
      firm_id: uuidFor(document.firmId),
      client_id: uuidFor(document.clientId),
      kind: document.kind,
      name: document.name,
      mime_type: document.mimeType,
      size_bytes: document.sizeBytes,
      storage_path: null,
      demo: true,
      visible_to_client: document.visibleToClient,
      uploaded_by: uuidFor(document.uploadedBy),
      uploaded_at: document.uploadedAt,
    })),
  );

  // 7. Alertes de cabinet ---------------------------------------------------
  console.log('Alertes');
  await insert(
    supabase,
    'alerts',
    buildStandaloneAlerts(now).map((alert) => ({
      id: uuidFor(alert.id),
      firm_id: uuidFor(alert.firmId),
      client_id: alert.clientId ? uuidFor(alert.clientId) : null,
      category: alert.category,
      severity: alert.severity,
      status: alert.status,
      title: alert.title,
      description: alert.description,
      suggested_action: alert.suggestedAction,
      assignee_id: alert.assigneeId ? uuidFor(alert.assigneeId) : null,
      rule_id: alert.ruleId,
      comments: alert.comments,
      created_at: alert.createdAt,
      resolved_at: alert.resolvedAt,
    })),
  );

  console.log('\nAmorçage terminé.');
  console.log(`Mot de passe des comptes de démonstration : ${DEMO_PASSWORD}`);
}

main().catch((error: unknown) => {
  console.error('\nÉchec de l’amorçage :', error instanceof Error ? error.message : error);
  process.exit(1);
});
