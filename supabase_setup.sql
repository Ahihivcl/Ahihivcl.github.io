-- Supabase setup for personal expense manager
-- Run this in Supabase SQL Editor after creating your project.

-- 1) Extensions
create extension if not exists pgcrypto;

-- 2) Shared timestamp trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 3) Profiles linked to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- Auto-create profile row when a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 4) Domain tables
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('expense', 'income', 'long_term')),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, name)
);

create trigger trg_categories_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  wallet_type text not null,
  balance numeric(19,2) not null default 0 check (balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, name)
);

create trigger trg_wallets_updated_at
before update on public.wallets
for each row
execute function public.set_updated_at();

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid not null references public.wallets(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  title text not null,
  amount numeric(19,2) not null check (amount > 0),
  transaction_date date not null default current_date,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_transactions_updated_at
before update on public.transactions
for each row
execute function public.set_updated_at();

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  amount_limit numeric(19,2) not null check (amount_limit > 0),
  start_date date not null default current_date,
  end_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create trigger trg_budgets_updated_at
before update on public.budgets
for each row
execute function public.set_updated_at();

create table if not exists public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(19,2) not null check (target_amount > 0),
  start_date date not null default current_date,
  target_date date,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_financial_goals_updated_at
before update on public.financial_goals
for each row
execute function public.set_updated_at();

-- 5) Helpful indexes
create index if not exists idx_categories_owner on public.categories(owner_id);
create index if not exists idx_wallets_owner on public.wallets(owner_id);
create index if not exists idx_transactions_owner_date on public.transactions(owner_id, transaction_date desc);
create index if not exists idx_transactions_wallet on public.transactions(wallet_id);
create index if not exists idx_transactions_category on public.transactions(category_id);
create index if not exists idx_budgets_owner on public.budgets(owner_id);
create index if not exists idx_financial_goals_owner on public.financial_goals(owner_id);

-- 6) Security helper
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid and p.role = 'admin'
  );
$$;

-- 7) Row Level Security
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.wallets enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.financial_goals enable row level security;

-- Profiles: user can read/update own profile, admin can read all.
drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid() and role in ('admin', 'user'));

-- Generic owner policies for domain tables
-- categories
drop policy if exists categories_select_owner_or_admin on public.categories;
create policy categories_select_owner_or_admin
on public.categories for select
to authenticated
using (owner_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists categories_insert_owner_or_admin on public.categories;
create policy categories_insert_owner_or_admin
on public.categories for insert
to authenticated
with check (owner_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists categories_update_owner_or_admin on public.categories;
create policy categories_update_owner_or_admin
on public.categories for update
to authenticated
using (owner_id = auth.uid() or public.is_admin(auth.uid()))
with check (owner_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists categories_delete_owner_or_admin on public.categories;
create policy categories_delete_owner_or_admin
on public.categories for delete
to authenticated
using (owner_id = auth.uid() or public.is_admin(auth.uid()));

-- wallets
drop policy if exists wallets_select_owner_or_admin on public.wallets;
create policy wallets_select_owner_or_admin
on public.wallets for select
to authenticated
using (owner_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists wallets_insert_owner_or_admin on public.wallets;
create policy wallets_insert_owner_or_admin
on public.wallets for insert
to authenticated
with check (owner_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists wallets_update_owner_or_admin on public.wallets;
create policy wallets_update_owner_or_admin
on public.wallets for update
to authenticated
using (owner_id = auth.uid() or public.is_admin(auth.uid()))
with check (owner_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists wallets_delete_owner_or_admin on public.wallets;
create policy wallets_delete_owner_or_admin
on public.wallets for delete
to authenticated
using (owner_id = auth.uid() or public.is_admin(auth.uid()));

-- transactions
drop policy if exists transactions_select_owner_or_admin on public.transactions;
create policy transactions_select_owner_or_admin
on public.transactions for select
to authenticated
using (owner_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists transactions_insert_owner_or_admin on public.transactions;
create policy transactions_insert_owner_or_admin
on public.transactions for insert
to authenticated
with check (owner_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists transactions_update_owner_or_admin on public.transactions;
create policy transactions_update_owner_or_admin
on public.transactions for update
to authenticated
using (owner_id = auth.uid() or public.is_admin(auth.uid()))
with check (owner_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists transactions_delete_owner_or_admin on public.transactions;
create policy transactions_delete_owner_or_admin
on public.transactions for delete
to authenticated
using (owner_id = auth.uid() or public.is_admin(auth.uid()));

-- budgets
drop policy if exists budgets_select_owner_or_admin on public.budgets;
create policy budgets_select_owner_or_admin
on public.budgets for select
to authenticated
using (owner_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists budgets_insert_owner_or_admin on public.budgets;
create policy budgets_insert_owner_or_admin
on public.budgets for insert
to authenticated
with check (owner_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists budgets_update_owner_or_admin on public.budgets;
create policy budgets_update_owner_or_admin
on public.budgets for update
to authenticated
using (owner_id = auth.uid() or public.is_admin(auth.uid()))
with check (owner_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists budgets_delete_owner_or_admin on public.budgets;
create policy budgets_delete_owner_or_admin
on public.budgets for delete
to authenticated
using (owner_id = auth.uid() or public.is_admin(auth.uid()));

-- financial_goals
drop policy if exists financial_goals_select_owner_or_admin on public.financial_goals;
create policy financial_goals_select_owner_or_admin
on public.financial_goals for select
to authenticated
using (owner_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists financial_goals_insert_owner_or_admin on public.financial_goals;
create policy financial_goals_insert_owner_or_admin
on public.financial_goals for insert
to authenticated
with check (owner_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists financial_goals_update_owner_or_admin on public.financial_goals;
create policy financial_goals_update_owner_or_admin
on public.financial_goals for update
to authenticated
using (owner_id = auth.uid() or public.is_admin(auth.uid()))
with check (owner_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists financial_goals_delete_owner_or_admin on public.financial_goals;
create policy financial_goals_delete_owner_or_admin
on public.financial_goals for delete
to authenticated
using (owner_id = auth.uid() or public.is_admin(auth.uid()));

-- 8) Optional starter categories for each new user can be inserted from frontend after signup.
-- This script does not insert global seed rows because every row is owner-scoped by design.
