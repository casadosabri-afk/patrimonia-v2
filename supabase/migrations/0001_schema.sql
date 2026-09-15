-- ============================================================================
-- PATRIMONIA — schéma multi-cabinet (multi-tenant)
--
-- Principe : toute donnée métier porte un `firm_id`. L'isolation entre cabinets
-- est assurée par les politiques Row Level Security définies dans la migration
-- 0002. Aucune requête applicative ne doit dépendre d'un `firm_id` transmis par
-- le navigateur.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- Cabinets --
create table if not exists public.firms (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null,
  slug        text        not null unique,
  plan        text        not null default 'demo' check (plan in ('demo', 'starter', 'business')),
  branding    jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------- Utilisateurs --
-- Le rôle vit ici, pas dans les métadonnées Supabase modifiables côté client.
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  firm_id       uuid        not null references public.firms (id) on delete cascade,
  role          text        not null check (role in ('admin', 'advisor', 'client')),
  email         text        not null,
  first_name    text        not null default '',
  last_name     text        not null default '',
  job_title     text,
  phone         text,
  avatar_color  text        not null default '#4152ab',
  active        boolean     not null default true,
  client_id     uuid,
  created_at    timestamptz not null default now(),
  last_login_at timestamptz
);

create index if not exists profiles_firm_idx on public.profiles (firm_id);

-- ------------------------------------------------------------------ Clients --
create table if not exists public.clients (
  id                  uuid primary key default gen_random_uuid(),
  firm_id             uuid        not null references public.firms (id) on delete cascade,
  first_name          text        not null,
  last_name           text        not null,
  email               text        not null,
  phone               text        not null default '',
  birth_date          date        not null,
  city                text        not null default '',
  postal_code         text        not null default '',
  profession          text        not null default '',
  marital_status      text        not null default 'celibataire',
  matrimonial_regime  text        not null default 'non_applicable',
  dependents          integer     not null default 0,
  risk_profile        text        not null default 'equilibre'
                        check (risk_profile in ('prudent', 'equilibre', 'dynamique', 'offensif')),
  status              text        not null default 'actif'
                        check (status in ('actif', 'prospect', 'archive')),
  horizon_years       integer     not null default 10,
  annual_income       numeric(14, 2) not null default 0,
  annual_expenses     numeric(14, 2) not null default 0,
  tax_bracket_rate    numeric(5, 2)  not null default 0,
  created_at          date        not null default current_date,
  last_review_at      date,
  profile_updated_at  date        not null default current_date,
  notes               text,
  avatar_color        text        not null default '#4152ab'
);

create index if not exists clients_firm_idx on public.clients (firm_id);

alter table public.profiles
  add constraint profiles_client_fk
  foreign key (client_id) references public.clients (id) on delete set null;

-- Un client peut être suivi par plusieurs conseillers : un principal, des associés.
create table if not exists public.client_advisors (
  client_id   uuid    not null references public.clients (id) on delete cascade,
  advisor_id  uuid    not null references public.profiles (id) on delete cascade,
  firm_id     uuid    not null references public.firms (id) on delete cascade,
  is_primary  boolean not null default false,
  since       date    not null default current_date,
  primary key (client_id, advisor_id)
);

-- Un seul conseiller principal par client.
create unique index if not exists client_advisors_single_primary
  on public.client_advisors (client_id) where is_primary;

-- -------------------------------------------------------------- Patrimoine --
create table if not exists public.asset_accounts (
  id           uuid primary key default gen_random_uuid(),
  firm_id      uuid not null references public.firms (id) on delete cascade,
  client_id    uuid not null references public.clients (id) on delete cascade,
  kind         text not null,
  label        text not null,
  institution  text not null default '',
  opened_at    date not null default current_date,
  cash_balance numeric(14, 2) not null default 0,
  currency     text not null default 'EUR'
);

create index if not exists asset_accounts_client_idx on public.asset_accounts (client_id);

create table if not exists public.investments (
  id             uuid primary key default gen_random_uuid(),
  firm_id        uuid not null references public.firms (id) on delete cascade,
  client_id      uuid not null references public.clients (id) on delete cascade,
  account_id     uuid not null references public.asset_accounts (id) on delete cascade,
  name           text not null,
  ticker         text,
  isin           text,
  type           text not null,
  asset_class    text not null,
  sector         text not null default '',
  region         text not null default '',
  quantity       numeric(18, 6) not null default 0,
  average_cost   numeric(14, 4) not null default 0,
  fallback_price numeric(14, 4) not null default 0,
  currency       text not null default 'EUR',
  purchased_at   date not null default current_date
);

create index if not exists investments_client_idx on public.investments (client_id);

create table if not exists public.real_estate_assets (
  id                  uuid primary key default gen_random_uuid(),
  firm_id             uuid not null references public.firms (id) on delete cascade,
  client_id           uuid not null references public.clients (id) on delete cascade,
  label               text not null,
  kind                text not null,
  city                text not null default '',
  postal_code         text not null default '',
  surface_m2          numeric(10, 2) not null default 0,
  purchase_price      numeric(14, 2) not null default 0,
  current_value       numeric(14, 2) not null default 0,
  purchased_at        date not null default current_date,
  monthly_rent        numeric(12, 2) not null default 0,
  monthly_charges     numeric(12, 2) not null default 0,
  annual_property_tax numeric(12, 2) not null default 0,
  ownership_pct       numeric(5, 2)  not null default 100,
  linked_debt_id      uuid
);

create index if not exists real_estate_client_idx on public.real_estate_assets (client_id);

create table if not exists public.debts (
  id                  uuid primary key default gen_random_uuid(),
  firm_id             uuid not null references public.firms (id) on delete cascade,
  client_id           uuid not null references public.clients (id) on delete cascade,
  label               text not null,
  kind                text not null,
  lender              text not null default '',
  initial_amount      numeric(14, 2) not null default 0,
  remaining_amount    numeric(14, 2) not null default 0,
  annual_rate_pct     numeric(6, 3)  not null default 0,
  insurance_rate_pct  numeric(6, 3)  not null default 0,
  monthly_payment     numeric(12, 2) not null default 0,
  started_at          date not null default current_date,
  ends_at             date not null default current_date
);

create index if not exists debts_client_idx on public.debts (client_id);

alter table public.real_estate_assets
  add constraint real_estate_debt_fk
  foreign key (linked_debt_id) references public.debts (id) on delete set null;

create table if not exists public.goals (
  id                   uuid primary key default gen_random_uuid(),
  firm_id              uuid not null references public.firms (id) on delete cascade,
  client_id            uuid not null references public.clients (id) on delete cascade,
  kind                 text not null,
  label                text not null,
  target_amount        numeric(14, 2) not null default 0,
  current_amount       numeric(14, 2) not null default 0,
  monthly_contribution numeric(12, 2) not null default 0,
  target_date          date not null,
  priority             text not null default 'moyenne' check (priority in ('haute', 'moyenne', 'basse')),
  created_at           date not null default current_date,
  notes                text
);

create index if not exists goals_client_idx on public.goals (client_id);

-- ------------------------------------------------------------------ Alertes --
create table if not exists public.alerts (
  id               uuid primary key default gen_random_uuid(),
  firm_id          uuid not null references public.firms (id) on delete cascade,
  client_id        uuid references public.clients (id) on delete cascade,
  category         text not null check (category in ('risque', 'opportunite', 'marche', 'client', 'administratif')),
  severity         text not null check (severity in ('critique', 'eleve', 'moyen', 'faible')),
  status           text not null default 'ouverte' check (status in ('ouverte', 'en_cours', 'traitee', 'ignoree')),
  title            text not null,
  description      text not null default '',
  suggested_action text not null default '',
  assignee_id      uuid references public.profiles (id) on delete set null,
  rule_id          text,
  comments         jsonb not null default '[]'::jsonb,
  created_at       timestamptz not null default now(),
  resolved_at      timestamptz
);

create index if not exists alerts_firm_status_idx on public.alerts (firm_id, status);

-- ---------------------------------------------------------------------- CRM --
create table if not exists public.interactions (
  id          uuid primary key default gen_random_uuid(),
  firm_id     uuid not null references public.firms (id) on delete cascade,
  client_id   uuid not null references public.clients (id) on delete cascade,
  advisor_id  uuid not null references public.profiles (id) on delete cascade,
  kind        text not null,
  title       text not null,
  body        text not null default '',
  status      text not null default 'termine' check (status in ('a_faire', 'en_cours', 'termine')),
  occurred_at timestamptz not null default now(),
  due_at      timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists interactions_client_idx on public.interactions (client_id, occurred_at desc);

create table if not exists public.appointments (
  id           uuid primary key default gen_random_uuid(),
  firm_id      uuid not null references public.firms (id) on delete cascade,
  client_id    uuid not null references public.clients (id) on delete cascade,
  advisor_id   uuid not null references public.profiles (id) on delete cascade,
  kind         text not null,
  title        text not null,
  starts_at    timestamptz not null,
  duration_min integer not null default 60,
  location     text not null default '',
  status       text not null default 'planifie' check (status in ('planifie', 'confirme', 'annule', 'realise')),
  notes        text
);

create index if not exists appointments_firm_start_idx on public.appointments (firm_id, starts_at);

-- --------------------------------------------------------------- Messagerie --
create table if not exists public.conversations (
  id                  uuid primary key default gen_random_uuid(),
  firm_id             uuid not null references public.firms (id) on delete cascade,
  client_id           uuid not null references public.clients (id) on delete cascade,
  advisor_id          uuid not null references public.profiles (id) on delete cascade,
  subject             text not null default '',
  updated_at          timestamptz not null default now(),
  unread_for_advisor  integer not null default 0,
  unread_for_client   integer not null default 0
);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  firm_id         uuid not null references public.firms (id) on delete cascade,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  author_role     text not null check (author_role in ('advisor', 'client')),
  author_id       uuid not null,
  body            text not null,
  sent_at         timestamptz not null default now(),
  attachment_ids  uuid[] not null default '{}'
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, sent_at);

-- ---------------------------------------------------------------- Documents --
create table if not exists public.documents (
  id                uuid primary key default gen_random_uuid(),
  firm_id           uuid not null references public.firms (id) on delete cascade,
  client_id         uuid not null references public.clients (id) on delete cascade,
  kind              text not null check (kind in ('releve', 'justificatif', 'rapport', 'contrat', 'fiscal', 'autre')),
  name              text not null,
  mime_type         text not null default 'application/octet-stream',
  size_bytes        bigint not null default 0,
  storage_path      text,
  demo              boolean not null default false,
  visible_to_client boolean not null default true,
  uploaded_by       uuid not null references public.profiles (id) on delete cascade,
  uploaded_at       timestamptz not null default now()
);

create index if not exists documents_client_idx on public.documents (client_id, uploaded_at desc);

-- -------------------------------------------------------------------- Audit --
create table if not exists public.audit_log (
  id           uuid primary key default gen_random_uuid(),
  firm_id      uuid not null references public.firms (id) on delete cascade,
  user_id      uuid not null,
  user_label   text not null default '',
  action       text not null,
  target_type  text not null,
  target_id    uuid,
  target_label text,
  metadata     jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists audit_firm_idx on public.audit_log (firm_id, created_at desc);

-- ------------------------------------------------------------ Accès par QR --
-- Le QR code ne transporte jamais de donnée personnelle : seul ce jeton
-- opaque, à durée de vie courte et à usage unique, circule.
create table if not exists public.qr_tokens (
  token       text primary key,
  firm_id     uuid not null references public.firms (id) on delete cascade,
  client_id   uuid not null references public.clients (id) on delete cascade,
  created_by  uuid not null references public.profiles (id) on delete cascade,
  scope       text not null default 'client_file' check (scope in ('client_file', 'client_portal')),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  used_at     timestamptz
);

create index if not exists qr_tokens_expiry_idx on public.qr_tokens (expires_at);
