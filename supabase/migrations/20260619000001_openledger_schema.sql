-- OpenLedger v0.1.1 — Initial Supabase Schema
-- This migration creates the foundation for optional future sync.
-- The app remains local-first; this schema is prepared for when
-- a user chooses to enable self-hosted sync.
--
-- All tables are prefixed with openledger_ because this Supabase
-- project is shared with other apps (Elora, etc.).

-- ============================================================
-- ACCOUNTS
-- ============================================================
create table if not exists openledger_accounts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid,                                   -- reserved for future auth
  name        text not null,
  kind        text not null default 'chequing',        -- chequing, savings, cash, credit-card, loan, investment, other
  subtitle    text not null default '',
  balance     numeric not null default 0,
  currency    text not null default 'CAD',
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- TRANSACTIONS
-- ============================================================
create table if not exists openledger_transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid,                                   -- reserved for future auth
  account_id   uuid not null references openledger_accounts(id) on delete cascade,
  date         date not null,
  description  text not null,
  merchant     text,
  amount       numeric not null,
  category     text not null default 'Misc',
  note         text,
  source       text not null default 'manual',          -- demo, csv, manual
  import_id    text,                                    -- links to openledger_imports
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- CATEGORIES
-- ============================================================
create table if not exists openledger_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  color      text,                                      -- hex colour for UI
  icon       text,                                      -- lucide icon name
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed default categories
insert into openledger_categories (name, color, icon) values
  ('Groceries',    '#88a874', 'ShoppingCart'),
  ('Rent',         '#d4a574', 'Home'),
  ('Food delivery','#e8c4a0', 'UtensilsCrossed'),
  ('Transport',    '#a0b4c8', 'Car'),
  ('Subscriptions','#b8a0c8', 'Repeat'),
  ('Income',       '#74a874', 'TrendingUp'),
  ('Debt',         '#c87474', 'CreditCard'),
  ('Utilities',    '#a0c8c0', 'Lightbulb'),
  ('Shopping',     '#c8a0a0', 'ShoppingBag'),
  ('Health',       '#a0c8a0', 'Heart'),
  ('Misc',         '#c0b8a0', 'MoreHorizontal')
on conflict (name) do nothing;

-- ============================================================
-- BUDGETS
-- ============================================================
create table if not exists openledger_budgets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid,                                    -- reserved for future auth
  category_id uuid references openledger_categories(id) on delete set null,
  month       text not null,                           -- YYYY-MM
  amount      numeric not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- GOALS
-- ============================================================
create table if not exists openledger_goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid,                                  -- reserved for future auth
  name           text not null,
  target_amount  numeric not null,
  current_amount numeric not null default 0,
  deadline       date,
  status         text not null default 'active',         -- active, completed, cancelled
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ============================================================
-- IMPORTS (CSV import history)
-- ============================================================
create table if not exists openledger_imports (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid,                                  -- reserved for future auth
  file_name       text not null,
  row_count       integer not null default 0,
  accepted_count  integer not null default 0,
  duplicate_count integer not null default 0,
  warning_count   integer not null default 0,
  status          text not null default 'pending',        -- pending, completed, failed
  created_at      timestamptz not null default now()
);

-- ============================================================
-- AUDIT EVENTS
-- ============================================================
create table if not exists openledger_audit_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid,                                      -- reserved for future auth
  event_type  text not null,                              -- created, updated, deleted, imported, exported
  entity_type text not null,                              -- account, transaction, budget, goal, import
  entity_id   text not null,
  old_values  jsonb,
  new_values  jsonb,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_openledger_transactions_account_id on openledger_transactions(account_id);
create index if not exists idx_openledger_transactions_date on openledger_transactions(date);
create index if not exists idx_openledger_transactions_category on openledger_transactions(category);
create index if not exists idx_openledger_transactions_user_id on openledger_transactions(user_id);
create index if not exists idx_openledger_accounts_user_id on openledger_accounts(user_id);
create index if not exists idx_openledger_budgets_month on openledger_budgets(month);
create index if not exists idx_openledger_goals_status on openledger_goals(status);
create index if not exists idx_openledger_audit_events_event_type on openledger_audit_events(event_type);
create index if not exists idx_openledger_audit_events_entity on openledger_audit_events(entity_type, entity_id);
create index if not exists idx_openledger_imports_status on openledger_imports(status);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function openledger_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on openledger_accounts;
create trigger set_updated_at before update on openledger_accounts
  for each row execute function openledger_set_updated_at();

drop trigger if exists set_updated_at on openledger_transactions;
create trigger set_updated_at before update on openledger_transactions
  for each row execute function openledger_set_updated_at();

drop trigger if exists set_updated_at on openledger_categories;
create trigger set_updated_at before update on openledger_categories
  for each row execute function openledger_set_updated_at();

drop trigger if exists set_updated_at on openledger_budgets;
create trigger set_updated_at before update on openledger_budgets
  for each row execute function openledger_set_updated_at();

drop trigger if exists set_updated_at on openledger_goals;
create trigger set_updated_at before update on openledger_goals
  for each row execute function openledger_set_updated_at();
