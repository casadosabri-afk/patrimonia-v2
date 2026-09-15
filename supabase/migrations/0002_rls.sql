-- ============================================================================
-- PATRIMONIA — Row Level Security
--
-- Chaque table métier est fermée par défaut. L'accès est accordé en fonction du
-- cabinet et du rôle portés par la ligne `profiles` de l'utilisateur connecté,
-- jamais en fonction d'une valeur transmise par l'application.
-- ============================================================================

-- ------------------------------------------------- Fonctions de contexte ----
-- `security definer` permet de lire `profiles` sans se heurter à la RLS de
-- cette même table ; `search_path` est figé pour éviter tout détournement.

create or replace function public.current_firm_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select firm_id from public.profiles where id = auth.uid() and active
$$;

create or replace function public.current_role_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and active
$$;

create or replace function public.current_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select client_id from public.profiles where id = auth.uid() and active
$$;

create or replace function public.is_firm_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role_name() in ('admin', 'advisor'), false)
$$;

create or replace function public.is_firm_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role_name() = 'admin', false)
$$;

-- Un client ne voit que son propre dossier ; le personnel du cabinet voit tous
-- les dossiers de son cabinet.
create or replace function public.can_read_client(target_client uuid, target_firm uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_firm = public.current_firm_id()
     and (public.is_firm_staff() or target_client = public.current_client_id())
$$;

-- ------------------------------------------------------ Activation de RLS ---
alter table public.firms             enable row level security;
alter table public.profiles          enable row level security;
alter table public.clients           enable row level security;
alter table public.client_advisors   enable row level security;
alter table public.asset_accounts    enable row level security;
alter table public.investments       enable row level security;
alter table public.real_estate_assets enable row level security;
alter table public.debts             enable row level security;
alter table public.goals             enable row level security;
alter table public.alerts            enable row level security;
alter table public.interactions      enable row level security;
alter table public.appointments      enable row level security;
alter table public.conversations     enable row level security;
alter table public.messages          enable row level security;
alter table public.documents         enable row level security;
alter table public.audit_log         enable row level security;
alter table public.qr_tokens         enable row level security;

-- ------------------------------------------------------------- Cabinets -----
drop policy if exists firms_select on public.firms;
create policy firms_select on public.firms
  for select using (id = public.current_firm_id());

drop policy if exists firms_update on public.firms;
create policy firms_update on public.firms
  for update using (id = public.current_firm_id() and public.is_firm_admin())
  with check (id = public.current_firm_id() and public.is_firm_admin());

-- --------------------------------------------------------- Utilisateurs -----
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (
    id = auth.uid()
    or (firm_id = public.current_firm_id() and public.is_firm_staff())
  );

drop policy if exists profiles_admin_write on public.profiles;
create policy profiles_admin_write on public.profiles
  for update using (firm_id = public.current_firm_id() and public.is_firm_admin())
  with check (firm_id = public.current_firm_id() and public.is_firm_admin());

drop policy if exists profiles_admin_insert on public.profiles;
create policy profiles_admin_insert on public.profiles
  for insert with check (firm_id = public.current_firm_id() and public.is_firm_admin());

-- -------------------------------------------------------------- Clients -----
drop policy if exists clients_select on public.clients;
create policy clients_select on public.clients
  for select using (public.can_read_client(id, firm_id));

drop policy if exists clients_staff_insert on public.clients;
create policy clients_staff_insert on public.clients
  for insert with check (firm_id = public.current_firm_id() and public.is_firm_staff());

drop policy if exists clients_staff_update on public.clients;
create policy clients_staff_update on public.clients
  for update using (firm_id = public.current_firm_id() and public.is_firm_staff())
  with check (firm_id = public.current_firm_id() and public.is_firm_staff());

drop policy if exists clients_admin_delete on public.clients;
create policy clients_admin_delete on public.clients
  for delete using (firm_id = public.current_firm_id() and public.is_firm_admin());

drop policy if exists client_advisors_select on public.client_advisors;
create policy client_advisors_select on public.client_advisors
  for select using (public.can_read_client(client_id, firm_id));

drop policy if exists client_advisors_write on public.client_advisors;
create policy client_advisors_write on public.client_advisors
  for all using (firm_id = public.current_firm_id() and public.is_firm_staff())
  with check (firm_id = public.current_firm_id() and public.is_firm_staff());

-- ----------------------------------------------------------- Patrimoine -----
-- Même règle pour toutes les tables rattachées à un client : lecture ouverte au
-- client concerné, écriture réservée au personnel du cabinet.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'asset_accounts', 'investments', 'real_estate_assets', 'debts', 'goals', 'documents'
  ]
  loop
    execute format('drop policy if exists %1$s_select on public.%1$s', table_name);
    execute format(
      'create policy %1$s_select on public.%1$s for select using (public.can_read_client(client_id, firm_id))',
      table_name
    );
    execute format('drop policy if exists %1$s_staff_write on public.%1$s', table_name);
    execute format(
      'create policy %1$s_staff_write on public.%1$s for all '
      'using (firm_id = public.current_firm_id() and public.is_firm_staff()) '
      'with check (firm_id = public.current_firm_id() and public.is_firm_staff())',
      table_name
    );
  end loop;
end;
$$;

-- Un client ne voit que les documents qui lui ont été explicitement partagés.
drop policy if exists documents_select on public.documents;
create policy documents_select on public.documents
  for select using (
    firm_id = public.current_firm_id()
    and (
      public.is_firm_staff()
      or (client_id = public.current_client_id() and visible_to_client)
    )
  );

-- -------------------------------------------------------------- Alertes -----
-- Les alertes sont un outil interne : elles ne sont jamais exposées au client.
drop policy if exists alerts_staff_select on public.alerts;
create policy alerts_staff_select on public.alerts
  for select using (firm_id = public.current_firm_id() and public.is_firm_staff());

drop policy if exists alerts_staff_write on public.alerts;
create policy alerts_staff_write on public.alerts
  for all using (firm_id = public.current_firm_id() and public.is_firm_staff())
  with check (firm_id = public.current_firm_id() and public.is_firm_staff());

-- ------------------------------------------------------------------ CRM -----
drop policy if exists interactions_staff on public.interactions;
create policy interactions_staff on public.interactions
  for all using (firm_id = public.current_firm_id() and public.is_firm_staff())
  with check (firm_id = public.current_firm_id() and public.is_firm_staff());

drop policy if exists appointments_select on public.appointments;
create policy appointments_select on public.appointments
  for select using (public.can_read_client(client_id, firm_id));

drop policy if exists appointments_staff_write on public.appointments;
create policy appointments_staff_write on public.appointments
  for all using (firm_id = public.current_firm_id() and public.is_firm_staff())
  with check (firm_id = public.current_firm_id() and public.is_firm_staff());

-- ------------------------------------------------------------ Messagerie ----
drop policy if exists conversations_select on public.conversations;
create policy conversations_select on public.conversations
  for select using (public.can_read_client(client_id, firm_id));

drop policy if exists conversations_write on public.conversations;
create policy conversations_write on public.conversations
  for all using (public.can_read_client(client_id, firm_id))
  with check (public.can_read_client(client_id, firm_id));

drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and public.can_read_client(c.client_id, c.firm_id)
    )
  );

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert with check (
    firm_id = public.current_firm_id()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and public.can_read_client(c.client_id, c.firm_id)
    )
  );

-- ---------------------------------------------------------------- Audit -----
-- Le journal est consultable par le personnel du cabinet et ne peut être ni
-- modifié ni supprimé depuis l'application.
drop policy if exists audit_select on public.audit_log;
create policy audit_select on public.audit_log
  for select using (firm_id = public.current_firm_id() and public.is_firm_staff());

drop policy if exists audit_insert on public.audit_log;
create policy audit_insert on public.audit_log
  for insert with check (firm_id = public.current_firm_id());

-- ------------------------------------------------------------ Jetons QR -----
drop policy if exists qr_tokens_staff on public.qr_tokens;
create policy qr_tokens_staff on public.qr_tokens
  for all using (firm_id = public.current_firm_id() and public.is_firm_staff())
  with check (firm_id = public.current_firm_id() and public.is_firm_staff());

-- ------------------------------------------------------------- Stockage -----
-- Bucket privé : le chemin d'un fichier commence par l'identifiant du cabinet,
-- ce qui permet d'appliquer le même cloisonnement aux pièces jointes.
insert into storage.buckets (id, name, public)
values ('client-documents', 'client-documents', false)
on conflict (id) do nothing;

drop policy if exists client_documents_read on storage.objects;
create policy client_documents_read on storage.objects
  for select using (
    bucket_id = 'client-documents'
    and (storage.foldername(name))[1] = public.current_firm_id()::text
  );

drop policy if exists client_documents_write on storage.objects;
create policy client_documents_write on storage.objects
  for insert with check (
    bucket_id = 'client-documents'
    and (storage.foldername(name))[1] = public.current_firm_id()::text
    and public.is_firm_staff()
  );

drop policy if exists client_documents_delete on storage.objects;
create policy client_documents_delete on storage.objects
  for delete using (
    bucket_id = 'client-documents'
    and (storage.foldername(name))[1] = public.current_firm_id()::text
    and public.is_firm_staff()
  );
