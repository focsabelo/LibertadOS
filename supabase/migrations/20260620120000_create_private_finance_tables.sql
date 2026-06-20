create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.dashboard_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  inputs jsonb not null default '{}'::jsonb,
  roadmap_simulated_contribution numeric not null default 0,
  onboarding_seen boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table public.target_portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  targets jsonb not null default '{}'::jsonb,
  manual_amounts jsonb not null default '{}'::jsonb,
  policy jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table public.bot_opera24hs_investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null default 'Bot Opera24hs',
  bot_number text not null default 'Bot 1',
  start_date date not null default current_date,
  initial_capital numeric not null default 0,
  monthly_contribution numeric not null default 0,
  reinvestment_rule text not null default '',
  reinvestment_minimum numeric not null default 0,
  monthly_results jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table public.investment_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  scope text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, scope)
);

create table public.financial_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  folder text not null,
  title text not null,
  body text not null default '',
  analysis jsonb not null default '[]'::jsonb,
  confirmed_transaction_ids uuid[] not null default '{}',
  pending_reconfirmation boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.confirmed_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  note_id uuid not null,
  note_title text not null,
  type text not null,
  amount numeric not null default 0,
  currency text not null default 'USD',
  category text not null default '',
  date date not null default current_date,
  recurring boolean not null default false,
  impulse boolean not null default false,
  core_expense boolean not null default false,
  intent text not null default 'real',
  freedom_impact numeric not null default 0,
  source_text text not null default '',
  income_increase boolean not null default false,
  ignored boolean not null default false,
  debt jsonb,
  anti_error_review jsonb,
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (note_id, user_id)
    references public.financial_notes(id, user_id)
    on delete cascade
);

create index dashboard_settings_user_id_idx on public.dashboard_settings(user_id);
create index target_portfolios_user_id_idx on public.target_portfolios(user_id);
create index bot_opera24hs_investments_user_id_idx on public.bot_opera24hs_investments(user_id);
create index investment_rules_user_id_idx on public.investment_rules(user_id);
create index financial_notes_user_id_updated_at_idx on public.financial_notes(user_id, updated_at desc);
create index confirmed_transactions_user_id_confirmed_at_idx on public.confirmed_transactions(user_id, confirmed_at desc);
create index confirmed_transactions_note_id_idx on public.confirmed_transactions(note_id);

create trigger dashboard_settings_set_updated_at
before update on public.dashboard_settings
for each row execute function public.set_updated_at();

create trigger target_portfolios_set_updated_at
before update on public.target_portfolios
for each row execute function public.set_updated_at();

create trigger bot_opera24hs_investments_set_updated_at
before update on public.bot_opera24hs_investments
for each row execute function public.set_updated_at();

create trigger investment_rules_set_updated_at
before update on public.investment_rules
for each row execute function public.set_updated_at();

create trigger financial_notes_set_updated_at
before update on public.financial_notes
for each row execute function public.set_updated_at();

create trigger confirmed_transactions_set_updated_at
before update on public.confirmed_transactions
for each row execute function public.set_updated_at();

alter table public.dashboard_settings enable row level security;
alter table public.target_portfolios enable row level security;
alter table public.bot_opera24hs_investments enable row level security;
alter table public.investment_rules enable row level security;
alter table public.financial_notes enable row level security;
alter table public.confirmed_transactions enable row level security;

create policy "Users can read own dashboard settings"
on public.dashboard_settings for select
using (auth.uid() = user_id);

create policy "Users can insert own dashboard settings"
on public.dashboard_settings for insert
with check (auth.uid() = user_id);

create policy "Users can update own dashboard settings"
on public.dashboard_settings for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own dashboard settings"
on public.dashboard_settings for delete
using (auth.uid() = user_id);

create policy "Users can read own target portfolios"
on public.target_portfolios for select
using (auth.uid() = user_id);

create policy "Users can insert own target portfolios"
on public.target_portfolios for insert
with check (auth.uid() = user_id);

create policy "Users can update own target portfolios"
on public.target_portfolios for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own target portfolios"
on public.target_portfolios for delete
using (auth.uid() = user_id);

create policy "Users can read own bot investments"
on public.bot_opera24hs_investments for select
using (auth.uid() = user_id);

create policy "Users can insert own bot investments"
on public.bot_opera24hs_investments for insert
with check (auth.uid() = user_id);

create policy "Users can update own bot investments"
on public.bot_opera24hs_investments for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own bot investments"
on public.bot_opera24hs_investments for delete
using (auth.uid() = user_id);

create policy "Users can read own investment rules"
on public.investment_rules for select
using (auth.uid() = user_id);

create policy "Users can insert own investment rules"
on public.investment_rules for insert
with check (auth.uid() = user_id);

create policy "Users can update own investment rules"
on public.investment_rules for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own investment rules"
on public.investment_rules for delete
using (auth.uid() = user_id);

create policy "Users can read own financial notes"
on public.financial_notes for select
using (auth.uid() = user_id);

create policy "Users can insert own financial notes"
on public.financial_notes for insert
with check (auth.uid() = user_id);

create policy "Users can update own financial notes"
on public.financial_notes for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own financial notes"
on public.financial_notes for delete
using (auth.uid() = user_id);

create policy "Users can read own confirmed transactions"
on public.confirmed_transactions for select
using (auth.uid() = user_id);

create policy "Users can insert own confirmed transactions"
on public.confirmed_transactions for insert
with check (auth.uid() = user_id);

create policy "Users can update own confirmed transactions"
on public.confirmed_transactions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own confirmed transactions"
on public.confirmed_transactions for delete
using (auth.uid() = user_id);
