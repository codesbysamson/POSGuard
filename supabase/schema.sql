-- ============================================================================
-- POSGuard database schema
-- Run this once in the Supabase SQL editor for your project
-- (Dashboard -> SQL Editor -> New query -> paste -> Run).
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Kiosk owners
-- One row per owner. id = auth.users.id (Supabase Auth), so RLS can key off
-- auth.uid() directly with no extra mapping table.
-- ----------------------------------------------------------------------------
create table if not exists kiosk_owners (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text unique,
  business_name text,
  created_at timestamptz not null default now()
);

-- Auto-create a kiosk_owners row whenever someone signs up via Supabase Auth.
create or replace function handle_new_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into kiosk_owners (id, phone)
  values (new.id, new.phone);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_owner();

-- ----------------------------------------------------------------------------
-- Terminals (kiosks)
-- access_code is what the OPERATOR uses on the shop floor. It is deliberately
-- separate from the owner's login, so an operator never needs (or can see)
-- the owner's credentials, and a compromised terminal code only exposes that
-- one kiosk, not the owner's whole account.
-- ----------------------------------------------------------------------------
create table if not exists terminals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references kiosk_owners (id) on delete cascade,
  kiosk_location_name text not null,
  assigned_operator_name text not null,
  access_code text not null unique default upper(substr(md5(random()::text), 1, 6)),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_terminals_owner on terminals (owner_id);

-- ----------------------------------------------------------------------------
-- Daily reconciliation logs
-- Rows in this table are only ever created by the submit_reconciliation()
-- function below (SECURITY DEFINER) so that:
--   1. the expected-cash / variance / status math is always computed
--      server-side, never trusted from the client
--   2. a log can never be inserted twice, or edited, for the same
--      terminal+date once is_locked = true
-- Direct client INSERT/UPDATE on this table is blocked by RLS (see below).
-- ----------------------------------------------------------------------------
create table if not exists daily_reconciliation_logs (
  id uuid primary key default gen_random_uuid(),
  terminal_id uuid not null references terminals (id) on delete cascade,
  log_date date not null,
  opening_cash numeric(14, 2) not null,
  net_other_cash_movements numeric(14, 2) not null default 0,
  movement_reason text,
  pos_withdrawal_volume numeric(14, 2) not null,
  pos_deposit_volume numeric(14, 2) not null,
  closing_cash numeric(14, 2) not null,
  calculated_expected_cash numeric(14, 2) not null,
  recorded_variance numeric(14, 2) not null,
  variance_reason text,
  status text not null check (status in ('Balanced', 'Shortage', 'Surplus')),
  submission_timestamp timestamptz not null default now(),
  is_locked boolean not null default true,
  unique (terminal_id, log_date)
);

-- Safe to re-run against an older version of the schema:
alter table daily_reconciliation_logs
  add column if not exists net_other_cash_movements numeric(14, 2) not null default 0;
alter table daily_reconciliation_logs
  add column if not exists movement_reason text;
alter table daily_reconciliation_logs
  add column if not exists variance_reason text;
-- If this ran on a version that had the earlier cash_injections column,
-- carry its values across then drop it.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'daily_reconciliation_logs' and column_name = 'cash_injections'
  ) then
    update daily_reconciliation_logs
      set net_other_cash_movements = cash_injections
      where net_other_cash_movements = 0;
    alter table daily_reconciliation_logs drop column cash_injections;
  end if;
end $$;

create index if not exists idx_logs_terminal on daily_reconciliation_logs (terminal_id);
create index if not exists idx_logs_date on daily_reconciliation_logs (log_date desc);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table kiosk_owners enable row level security;
alter table terminals enable row level security;
alter table daily_reconciliation_logs enable row level security;

-- Owners can only ever see/edit their own row.
create policy "owner reads own profile" on kiosk_owners
  for select using (auth.uid() = id);
create policy "owner updates own profile" on kiosk_owners
  for update using (auth.uid() = id);

-- Owners can fully manage their own terminals. There is NO public/anon
-- policy on this table, so an operator with just the anon key can never
-- browse the terminals list, read the owner's phone, or enumerate access
-- codes -- they can only reach a terminal through the access-code RPCs below.
create policy "owner manages own terminals" on terminals
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Owners can read (never write directly) the reconciliation history for
-- their own terminals. All writes happen through submit_reconciliation().
create policy "owner reads own logs" on daily_reconciliation_logs
  for select using (
    exists (
      select 1 from terminals
      where terminals.id = daily_reconciliation_logs.terminal_id
        and terminals.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- RPC: get_terminal_by_code
-- What the operator app calls after typing in the terminal access code.
-- Returns only what the operator screen needs -- never the owner's data,
-- never other kiosks' data, never past financial figures.
-- ============================================================================
create or replace function get_terminal_by_code(p_access_code text)
returns table (
  terminal_id uuid,
  kiosk_location_name text,
  assigned_operator_name text,
  today_is_locked boolean,
  today_submission_timestamp timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select
      t.id,
      t.kiosk_location_name,
      t.assigned_operator_name,
      coalesce(l.is_locked, false),
      l.submission_timestamp
    from terminals t
    left join daily_reconciliation_logs l
      on l.terminal_id = t.id and l.log_date = current_date
    where t.access_code = upper(p_access_code)
      and t.is_active = true;
end;
$$;

grant execute on function get_terminal_by_code(text) to anon, authenticated;

-- ============================================================================
-- RPC: submit_reconciliation
-- The ONLY way a reconciliation log is ever created. Runs as the function
-- owner (not the caller), so anon-key clients can call it without needing
-- table-level INSERT rights -- and it is the single source of truth for the
-- expected-cash / variance / status math and for locking the record.
-- ============================================================================
-- Drop older versions of this function if they exist from a prior run of
-- this schema, since Postgres treats a different argument list as a
-- different function and would otherwise leave stale versions active.
drop function if exists submit_reconciliation(text, numeric, numeric, numeric, numeric);
drop function if exists submit_reconciliation(text, numeric, numeric, numeric, numeric, numeric);

create or replace function submit_reconciliation(
  p_access_code text,
  p_opening_cash numeric,
  p_net_other_cash_movements numeric,
  p_movement_reason text,
  p_withdrawal_volume numeric,
  p_deposit_volume numeric,
  p_closing_cash numeric,
  p_variance_reason text
)
returns table (
  status text,
  recorded_variance numeric,
  calculated_expected_cash numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_terminal_id uuid;
  v_expected numeric(14, 2);
  v_variance numeric(14, 2);
  v_status text;
  v_already_locked boolean;
begin
  select t.id into v_terminal_id
  from terminals t
  where t.access_code = upper(p_access_code) and t.is_active = true;

  if v_terminal_id is null then
    raise exception 'Invalid terminal access code';
  end if;

  select exists(
    select 1 from daily_reconciliation_logs
    where terminal_id = v_terminal_id and log_date = current_date and is_locked = true
  ) into v_already_locked;

  if v_already_locked then
    raise exception 'Today''s ledger for this terminal is already submitted and locked';
  end if;

  -- Net other cash movements is allowed to be negative (cash moved OUT to
  -- rebalance float for a large withdrawal); everything else must be >= 0.
  if p_opening_cash < 0 or p_withdrawal_volume < 0
     or p_deposit_volume < 0 or p_closing_cash < 0 then
    raise exception 'Cash and volume figures cannot be negative';
  end if;

  v_expected := p_opening_cash + p_net_other_cash_movements + p_withdrawal_volume - p_deposit_volume;
  v_variance := p_closing_cash - v_expected;
  v_status := case
    when v_variance < 0 then 'Shortage'
    when v_variance > 0 then 'Surplus'
    else 'Balanced'
  end;

  insert into daily_reconciliation_logs (
    terminal_id, log_date, opening_cash, net_other_cash_movements, movement_reason,
    pos_withdrawal_volume, pos_deposit_volume, closing_cash, calculated_expected_cash,
    recorded_variance, variance_reason, status, is_locked
  ) values (
    v_terminal_id, current_date, p_opening_cash, p_net_other_cash_movements, nullif(p_movement_reason, ''),
    p_withdrawal_volume, p_deposit_volume, p_closing_cash, v_expected,
    v_variance, nullif(p_variance_reason, ''), v_status, true
  );

  return query select v_status, v_variance, v_expected;
end;
$$;

grant execute on function submit_reconciliation(text, numeric, numeric, text, numeric, numeric, numeric, text) to anon, authenticated;
