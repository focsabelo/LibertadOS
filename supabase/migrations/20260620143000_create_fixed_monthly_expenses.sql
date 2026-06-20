create table public.fixed_monthly_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null default 'Gasto fijo',
  category text not null default 'otros',
  monthly_amount numeric not null default 0,
  currency text not null default 'USD',
  is_active boolean not null default true,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index fixed_monthly_expenses_user_id_idx
on public.fixed_monthly_expenses(user_id);

create index fixed_monthly_expenses_user_active_idx
on public.fixed_monthly_expenses(user_id, is_active);

create trigger fixed_monthly_expenses_set_updated_at
before update on public.fixed_monthly_expenses
for each row execute function public.set_updated_at();

alter table public.fixed_monthly_expenses enable row level security;

create policy "Users can read own fixed monthly expenses"
on public.fixed_monthly_expenses for select
using (auth.uid() = user_id);

create policy "Users can insert own fixed monthly expenses"
on public.fixed_monthly_expenses for insert
with check (auth.uid() = user_id);

create policy "Users can update own fixed monthly expenses"
on public.fixed_monthly_expenses for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own fixed monthly expenses"
on public.fixed_monthly_expenses for delete
using (auth.uid() = user_id);
