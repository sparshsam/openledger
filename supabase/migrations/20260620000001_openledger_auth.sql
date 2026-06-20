-- OpenLedger v0.2.0 — Auth Foundation
-- Adds profiles table, RLS policies, and user_id columns for future ownership.
-- All existing data remains accessible. user_id columns are nullable.

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION (idempotent)
-- ============================================================
create or replace function openledger_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- PROFILES TABLE
-- ============================================================
create table if not exists openledger_profiles (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade unique not null,
  display_name text,
  email        text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists set_updated_at on openledger_profiles;
create trigger set_updated_at before update on openledger_profiles
  for each row execute function openledger_set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- openledger_profiles
alter table openledger_profiles enable row level security;

create policy "Users can view their own profile"
  on openledger_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own profile"
  on openledger_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own profile"
  on openledger_profiles for update
  using (auth.uid() = user_id);

-- openledger_accounts
alter table openledger_accounts enable row level security;

create policy "Users can view own accounts"
  on openledger_accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert own accounts"
  on openledger_accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own accounts"
  on openledger_accounts for update
  using (auth.uid() = user_id);

create policy "Users can delete own accounts"
  on openledger_accounts for delete
  using (auth.uid() = user_id);

-- openledger_transactions
alter table openledger_transactions enable row level security;

create policy "Users can view own transactions"
  on openledger_transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on openledger_transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own transactions"
  on openledger_transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete own transactions"
  on openledger_transactions for delete
  using (auth.uid() = user_id);

-- openledger_categories
alter table openledger_categories enable row level security;

create policy "Everyone can view categories"
  on openledger_categories for select
  using (true);

create policy "Authenticated users can insert categories"
  on openledger_categories for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update categories"
  on openledger_categories for update
  using (auth.role() = 'authenticated');

-- openledger_budgets
alter table openledger_budgets enable row level security;

create policy "Users can view own budgets"
  on openledger_budgets for select
  using (auth.uid() = user_id);

create policy "Users can insert own budgets"
  on openledger_budgets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own budgets"
  on openledger_budgets for update
  using (auth.uid() = user_id);

create policy "Users can delete own budgets"
  on openledger_budgets for delete
  using (auth.uid() = user_id);

-- openledger_goals
alter table openledger_goals enable row level security;

create policy "Users can view own goals"
  on openledger_goals for select
  using (auth.uid() = user_id);

create policy "Users can insert own goals"
  on openledger_goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update own goals"
  on openledger_goals for update
  using (auth.uid() = user_id);

create policy "Users can delete own goals"
  on openledger_goals for delete
  using (auth.uid() = user_id);

-- openledger_imports
alter table openledger_imports enable row level security;

create policy "Users can view own imports"
  on openledger_imports for select
  using (auth.uid() = user_id);

create policy "Users can insert own imports"
  on openledger_imports for insert
  with check (auth.uid() = user_id);

create policy "Users can update own imports"
  on openledger_imports for update
  using (auth.uid() = user_id);

-- openledger_audit_events
alter table openledger_audit_events enable row level security;

create policy "Users can view own audit events"
  on openledger_audit_events for select
  using (auth.uid() = user_id);

create policy "Users can insert own audit events"
  on openledger_audit_events for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- INDEXES FOR COMMON QUERIES
-- ============================================================
create index if not exists idx_openledger_profiles_user_id on openledger_profiles(user_id);
create index if not exists idx_openledger_transactions_date on openledger_transactions(date);
