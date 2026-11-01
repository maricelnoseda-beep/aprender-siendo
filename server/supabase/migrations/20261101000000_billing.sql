-- Cobros de Aprender Siendo (DEV-IA §9): esquema "billing", separado de los
-- datos clínicos y vinculado solo por el identificador interno de la cuenta.
-- No se guardan datos de tarjeta: solo identificadores de Mercado Pago, montos
-- y fechas. Solo las funciones del servidor (service role) escriben.

create schema if not exists billing;

-- Parámetros comerciales que fija la responsable del proyecto.
create table billing.config (
  id smallint primary key default 1 check (id = 1),
  -- Cotización oficial BNA, dólar billete vendedor (decisión de la responsable,
  -- 2026-11-01). La actualiza la tarea diaria cotizacion-bna. Sin valor o con
  -- un valor de más de 5 días, nadie puede suscribirse (falla cerrado).
  ars_per_usd numeric(12,2) check (ars_per_usd > 0),
  rate_updated_at timestamptz,
  rate_source text,
  grace_days smallint not null default 3 check (grace_days between 0 and 15),
  updated_at timestamptz not null default now(),
  updated_by text
);
insert into billing.config (id) values (1);

-- Fin de la prueba gratuita, calculado al activar la cuenta (15 días).
create table billing.trials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  trial_end timestamptz not null
);

create table billing.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null check (plan_id in ('mensual', 'anual')),
  usd_cents integer not null,
  ars_per_usd numeric(12,2) not null,
  amount_ars integer not null check (amount_ars > 0),
  status text not null check (status in ('pendiente', 'activa', 'pausada', 'cancelada', 'arrepentimiento')),
  mp_preapproval_id text unique,
  consent_at timestamptz not null,        -- confirmación expresa del cobro
  consent_version text not null,          -- versión del texto que aceptó
  rules_version text not null,            -- versión de billing-rules.mjs
  started_at timestamptz,
  paid_through timestamptz,
  cancelled_at timestamptz,
  refund_status text check (refund_status in ('pendiente', 'reembolsado')),
  created_at timestamptz not null default now()
);
create index on billing.subscriptions (user_id, created_at desc);

create table billing.payments (
  mp_payment_id text primary key,         -- evita contar dos veces el mismo pago
  subscription_id uuid not null references billing.subscriptions(id),
  amount_ars integer not null,
  paid_at timestamptz not null,
  recorded_at timestamptz not null default now()
);

create table billing.webhook_events (
  key text primary key,                   -- evita procesar dos veces el mismo aviso
  type text not null,
  data_id text not null,
  received_at timestamptz not null default now()
);

-- Historial de lecturas de la cotización (aplicadas o descartadas).
create table billing.exchange_rates (
  id bigserial primary key,
  read_at timestamptz not null,
  compra numeric(12,2) not null,
  venta numeric(12,2) not null,
  source text not null,
  applied boolean not null,
  reason text
);

create table billing.alerts (
  id bigserial primary key,
  subscription_id uuid references billing.subscriptions(id),
  detail text not null,
  created_at timestamptz not null default now(),
  resolved boolean not null default false
);

-- Permisos por fila: cada persona ve solo su suscripción y su prueba; nadie
-- escribe desde el navegador.
alter table billing.config enable row level security;
alter table billing.trials enable row level security;
alter table billing.subscriptions enable row level security;
alter table billing.payments enable row level security;
alter table billing.webhook_events enable row level security;
alter table billing.alerts enable row level security;
alter table billing.exchange_rates enable row level security;

create policy "ver mi prueba" on billing.trials for select using (auth.uid() = user_id);
create policy "ver mi suscripcion" on billing.subscriptions for select using (auth.uid() = user_id);

grant usage on schema billing to authenticated;
grant select on billing.trials, billing.subscriptions to authenticated;

-- Acceso para usar en las políticas RLS de los datos de la app.
-- Debe replicar Billing.accessStatus de billing-rules.mjs (misma regla).
-- Sin parámetro: cada persona solo puede consultar su propio acceso.
create or replace function billing.tengo_acceso()
returns boolean language sql stable security definer set search_path = billing, pg_temp as $$
  with me as (select auth.uid() as uid)
  select
    exists (select 1 from billing.trials t, me where t.user_id = me.uid and now() < t.trial_end)
    or exists (
      select 1 from billing.subscriptions s, billing.config c, me
      where s.user_id = me.uid and s.status <> 'arrepentimiento' and s.paid_through is not null
        and (now() < s.paid_through
             or (s.status = 'activa' and now() < s.paid_through + make_interval(days => c.grace_days)))
    );
$$;
revoke all on function billing.tengo_acceso() from public;
grant execute on function billing.tengo_acceso() to authenticated;

-- Tarea diaria de la cotización (lunes a viernes, 16:30 hora argentina = 19:30 UTC).
-- Requiere las extensiones pg_cron y pg_net, y dos secretos en Supabase Vault
-- (`project_url` y `cron_secret`) que carga el responsable técnico. Se deja
-- comentado para activarlo al crear cada proyecto:
--
-- select cron.schedule('cotizacion-bna', '30 19 * * 1-5', $$
--   select net.http_post(
--     url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/cotizacion-bna',
--     headers := jsonb_build_object('x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'))
--   );
-- $$);
