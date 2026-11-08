
create type public.app_role as enum ('admin','gestor','operador');
create type public.br_classification as enum ('confirmado','provavel','nao_identificado');
create type public.lead_status as enum ('novo','qualificado','em_prospeccao','contatado','em_negociacao','convertido','descartado');
create type public.job_status as enum ('pendente','executando','concluido','erro','cancelado');

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path=public as $$
begin new.updated_at = now(); return new; end $$;

-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, company text, avatar_url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null, unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create or replace function public.is_manager(_user_id uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role in ('admin','gestor')) $$;

create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_manager(auth.uid()));
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "roles read" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- first user becomes admin, others operador
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  if not exists (select 1 from public.user_roles) then
    insert into public.user_roles(user_id, role) values (new.id,'admin');
  else
    insert into public.user_roles(user_id, role) values (new.id,'operador');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- admin role management
create or replace function public.set_user_role(_user_id uuid, _role app_role) returns void
language plpgsql security definer set search_path=public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Apenas administradores'; end if;
  delete from public.user_roles where user_id=_user_id;
  insert into public.user_roles(user_id, role) values (_user_id,_role);
  insert into public.activity_logs(actor_id, action, entity, entity_id, details) values (auth.uid(),'role_changed','user',_user_id::text, jsonb_build_object('role',_role));
end $$;

-- companies
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null, segment text, country text, city text, address text,
  website text, instagram text, linkedin text, phone text, email text,
  is_demo boolean not null default false,
  created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on public.companies(country); create index on public.companies(segment);

create table public.business_owners (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  full_name text, role_title text, linkedin text,
  br_classification br_classification not null default 'nao_identificado',
  br_confidence int not null default 0 check (br_confidence between 0 and 100),
  br_justification text, br_sources text[] default '{}', last_verified_at timestamptz,
  is_demo boolean not null default false, created_at timestamptz not null default now()
);
create index on public.business_owners(company_id);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  owner_id uuid references public.business_owners(id) on delete set null,
  owner_name text, company_name text not null, segment text, country text, city text, address text,
  website text, instagram text, linkedin text, email text, phone text, whatsapp text,
  contact_name text, contact_role text, source text,
  br_classification br_classification not null default 'nao_identificado',
  br_confidence int not null default 0,
  br_justification text, br_sources text[] default '{}',
  email_status text not null default 'nao_verificado', -- nao_verificado | sintaxe_valida | dominio_valido | confirmado | invalido
  phone_status text not null default 'nao_verificado', -- nao_verificado | formato_valido | invalido
  website_status text not null default 'nao_verificado',
  status lead_status not null default 'novo',
  score int not null default 0 check (score between 0 and 100),
  tags text[] not null default '{}', favorite boolean not null default false, notes text,
  ai_summary text, ai_approach text, ai_opportunities text,
  job_id uuid, is_demo boolean not null default false,
  created_by uuid, discovered_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on public.leads(country); create index on public.leads(segment); create index on public.leads(status);
create index on public.leads(br_classification); create index on public.leads(score desc); create index on public.leads(discovered_at desc);
create trigger leads_touch before update on public.leads for each row execute function public.touch_updated_at();
create trigger companies_touch before update on public.companies for each row execute function public.touch_updated_at();

create table public.lead_sources (
  id uuid primary key default gen_random_uuid(),
  key text unique not null, name text not null, description text,
  status text not null default 'nao_configurado', -- ativo | nao_configurado | erro | pausado | demonstracao
  enabled boolean not null default false, last_run_at timestamptz, records_found int not null default 0,
  rate_limit_per_min int not null default 60, max_retries int not null default 3, last_error text,
  created_at timestamptz not null default now()
);

create table public.lead_verifications (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade not null,
  kind text not null, result text not null, details jsonb default '{}', created_by uuid,
  created_at timestamptz not null default now()
);
create index on public.lead_verifications(lead_id);

create table public.lead_scores (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade not null,
  score int not null, breakdown jsonb not null default '{}', created_at timestamptz not null default now()
);
create index on public.lead_scores(lead_id);

create table public.prospecting_configurations (
  id uuid primary key default gen_random_uuid(),
  name text not null, countries text[] not null default '{}', cities text[] not null default '{}',
  segments text[] not null default '{}', filters jsonb not null default '{}', quantity int not null default 50,
  created_by uuid, created_at timestamptz not null default now()
);

create table public.prospecting_jobs (
  id uuid primary key default gen_random_uuid(),
  configuration_id uuid references public.prospecting_configurations(id) on delete set null,
  mode text not null default 'demonstracao', status job_status not null default 'pendente',
  countries text[] default '{}', cities text[] default '{}', segments text[] default '{}', filters jsonb default '{}',
  quantity int not null default 50,
  found int not null default 0, processed int not null default 0, enriched int not null default 0,
  validated int not null default 0, duplicates_removed int not null default 0,
  logs jsonb not null default '[]', error text,
  created_by uuid, started_at timestamptz, finished_at timestamptz, created_at timestamptz not null default now()
);
create index on public.prospecting_jobs(created_at desc);

create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  key text unique not null, name text not null, category text not null,
  status text not null default 'nao_configurado', config jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null, countries text[] default '{}', cities text[] default '{}', segments text[] default '{}',
  frequency text not null default 'semanal', max_records int not null default 100,
  update_existing boolean not null default true, detect_new boolean not null default true, notify boolean not null default true,
  active boolean not null default true, last_run_at timestamptz, next_run_at timestamptz,
  created_by uuid, created_at timestamptz not null default now()
);

create table public.automation_logs (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid references public.automation_rules(id) on delete cascade,
  status text not null, message text, records int default 0, created_at timestamptz not null default now()
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid, action text not null, entity text, entity_id text, details jsonb default '{}',
  created_at timestamptz not null default now()
);
create index on public.activity_logs(created_at desc);
create index on public.activity_logs(entity, entity_id);

create table public.suppression_list (
  id uuid primary key default gen_random_uuid(),
  value text unique not null, kind text not null default 'email', reason text,
  created_by uuid, created_at timestamptz not null default now()
);

create table public.app_settings (
  id int primary key default 1 check (id = 1),
  ai_provider text not null default 'lovable', ai_model text not null default 'google/gemini-3-flash-preview',
  score_weights jsonb not null default '{"perfil":20,"qualidade":20,"presenca":15,"responsavel":15,"potencial":15,"compatibilidade":15}',
  max_records_per_job int not null default 500, retention_days int not null default 730,
  notify_email boolean not null default true, cost_per_record numeric not null default 0.02,
  updated_at timestamptz not null default now()
);
insert into public.app_settings(id) values (1);

-- grants
grant select, insert, update, delete on public.companies, public.business_owners, public.leads, public.lead_verifications, public.lead_scores,
  public.prospecting_configurations, public.prospecting_jobs, public.automation_rules, public.automation_logs, public.suppression_list to authenticated;
grant select, insert on public.activity_logs to authenticated;
grant select, update on public.lead_sources, public.integrations, public.app_settings to authenticated;
grant all on public.companies, public.business_owners, public.leads, public.lead_sources, public.lead_verifications, public.lead_scores,
  public.prospecting_configurations, public.prospecting_jobs, public.integrations, public.automation_rules, public.automation_logs,
  public.activity_logs, public.suppression_list, public.app_settings to service_role;

alter table public.companies enable row level security;
alter table public.business_owners enable row level security;
alter table public.leads enable row level security;
alter table public.lead_sources enable row level security;
alter table public.lead_verifications enable row level security;
alter table public.lead_scores enable row level security;
alter table public.prospecting_configurations enable row level security;
alter table public.prospecting_jobs enable row level security;
alter table public.integrations enable row level security;
alter table public.automation_rules enable row level security;
alter table public.automation_logs enable row level security;
alter table public.activity_logs enable row level security;
alter table public.suppression_list enable row level security;
alter table public.app_settings enable row level security;

-- team-shared data: any role member reads/writes; deletes restricted to managers
do $$ declare t text; begin
  foreach t in array array['companies','business_owners','leads','lead_verifications','lead_scores','prospecting_configurations','prospecting_jobs','automation_rules','automation_logs','suppression_list'] loop
    execute format('create policy "team read" on public.%I for select to authenticated using (exists(select 1 from public.user_roles r where r.user_id=auth.uid()))', t);
    execute format('create policy "team insert" on public.%I for insert to authenticated with check (exists(select 1 from public.user_roles r where r.user_id=auth.uid()))', t);
    execute format('create policy "team update" on public.%I for update to authenticated using (exists(select 1 from public.user_roles r where r.user_id=auth.uid()))', t);
  end loop;
end $$;
create policy "managers delete" on public.companies for delete to authenticated using (public.is_manager(auth.uid()));
create policy "managers delete" on public.business_owners for delete to authenticated using (public.is_manager(auth.uid()));
create policy "managers delete" on public.leads for delete to authenticated using (public.is_manager(auth.uid()));
create policy "managers delete" on public.lead_verifications for delete to authenticated using (public.is_manager(auth.uid()));
create policy "managers delete" on public.lead_scores for delete to authenticated using (public.is_manager(auth.uid()));
create policy "managers delete" on public.prospecting_configurations for delete to authenticated using (public.is_manager(auth.uid()));
create policy "managers delete" on public.prospecting_jobs for delete to authenticated using (public.is_manager(auth.uid()));
create policy "managers delete" on public.automation_rules for delete to authenticated using (public.is_manager(auth.uid()));
create policy "managers delete" on public.automation_logs for delete to authenticated using (public.is_manager(auth.uid()));
create policy "managers delete" on public.suppression_list for delete to authenticated using (public.is_manager(auth.uid()));

create policy "team read" on public.lead_sources for select to authenticated using (true);
create policy "admin update" on public.lead_sources for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "team read" on public.integrations for select to authenticated using (true);
create policy "admin update" on public.integrations for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "team read" on public.app_settings for select to authenticated using (true);
create policy "admin update" on public.app_settings for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "managers read logs" on public.activity_logs for select to authenticated using (public.is_manager(auth.uid()) or actor_id = auth.uid());
create policy "self insert logs" on public.activity_logs for insert to authenticated with check (actor_id = auth.uid());

-- audit trigger for leads
create or replace function public.audit_leads() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op='INSERT' then
    insert into public.activity_logs(actor_id, action, entity, entity_id, details) values (auth.uid(),'lead_created','lead',new.id::text, jsonb_build_object('company',new.company_name,'demo',new.is_demo));
  elsif tg_op='UPDATE' then
    insert into public.activity_logs(actor_id, action, entity, entity_id, details) values (auth.uid(),'lead_updated','lead',new.id::text,
      jsonb_build_object('company',new.company_name,'status_from',old.status,'status_to',new.status,'score_from',old.score,'score_to',new.score));
  elsif tg_op='DELETE' then
    insert into public.activity_logs(actor_id, action, entity, entity_id, details) values (auth.uid(),'lead_deleted','lead',old.id::text, jsonb_build_object('company',old.company_name));
    return old;
  end if;
  return new;
end $$;
create trigger leads_audit after insert or update or delete on public.leads for each row execute function public.audit_leads();

-- seed connectors & integrations
insert into public.lead_sources(key,name,description,status) values
 ('google_places','Google Places API','Busca de estabelecimentos por categoria e localidade','nao_configurado'),
 ('google_maps','Google Maps Platform','Geocodificação e detalhes de endereços','nao_configurado'),
 ('public_directories','Diretórios empresariais públicos','Listagens públicas de câmaras e diretórios','nao_configurado'),
 ('websites','Sites institucionais','Leitura de páginas "Sobre" públicas respeitando robots.txt','nao_configurado'),
 ('enrichment_api','APIs de enriquecimento','Apollo, Clay ou similares via conector','nao_configurado'),
 ('associations','Associações comerciais','Câmaras de comércio Brasil-EUA/Europa','nao_configurado'),
 ('instagram','Instagram (Graph API)','Somente via API oficial com permissões','nao_configurado'),
 ('linkedin','LinkedIn (API oficial)','Somente via parceria/API autorizada','nao_configurado'),
 ('demo','Gerador de demonstração','Dados fictícios identificados como demonstração','demonstracao');
update public.lead_sources set enabled=true where key='demo';
insert into public.integrations(key,name,category) values
 ('hubspot','HubSpot','crm'),('pipedrive','Pipedrive','crm'),('rdstation','RD Station','crm'),
 ('webhook','Webhook personalizado','webhook'),('rest_api','API REST','api'),('python_service','Serviço Python (FastAPI)','engine'),
 ('openai','OpenAI','ai'),('anthropic','Anthropic','ai'),('gemini','Google Gemini','ai');
