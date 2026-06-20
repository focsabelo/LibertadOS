create table public.weekly_execution_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  week_key text not null,
  completed_item_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_key)
);

create index weekly_execution_reviews_user_id_week_key_idx
on public.weekly_execution_reviews(user_id, week_key);

create trigger weekly_execution_reviews_set_updated_at
before update on public.weekly_execution_reviews
for each row execute function public.set_updated_at();

alter table public.weekly_execution_reviews enable row level security;

create policy "Users can read own weekly execution reviews"
on public.weekly_execution_reviews for select
using (auth.uid() = user_id);

create policy "Users can insert own weekly execution reviews"
on public.weekly_execution_reviews for insert
with check (auth.uid() = user_id);

create policy "Users can update own weekly execution reviews"
on public.weekly_execution_reviews for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own weekly execution reviews"
on public.weekly_execution_reviews for delete
using (auth.uid() = user_id);
