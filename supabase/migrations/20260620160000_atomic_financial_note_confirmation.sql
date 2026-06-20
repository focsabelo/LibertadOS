create or replace function public.save_financial_note_draft(
  p_user_id uuid,
  p_note_id uuid,
  p_folder text,
  p_title text,
  p_body text,
  p_created_at timestamptz,
  p_updated_at timestamptz,
  p_analysis jsonb,
  p_confirmed_transaction_ids uuid[],
  p_pending_reconfirmation boolean,
  p_delete_confirmed_transactions boolean default true
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  affected_rows integer;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Not allowed to save financial note';
  end if;

  insert into public.financial_notes (
    id,
    user_id,
    folder,
    title,
    body,
    created_at,
    updated_at,
    analysis,
    confirmed_transaction_ids,
    pending_reconfirmation
  )
  values (
    p_note_id,
    p_user_id,
    p_folder,
    p_title,
    p_body,
    p_created_at,
    p_updated_at,
    coalesce(p_analysis, '[]'::jsonb),
    coalesce(p_confirmed_transaction_ids, '{}'::uuid[]),
    coalesce(p_pending_reconfirmation, false)
  )
  on conflict (id) do update
  set
    folder = excluded.folder,
    title = excluded.title,
    body = excluded.body,
    updated_at = excluded.updated_at,
    analysis = excluded.analysis,
    confirmed_transaction_ids = excluded.confirmed_transaction_ids,
    pending_reconfirmation = excluded.pending_reconfirmation
  where public.financial_notes.user_id = p_user_id;

  get diagnostics affected_rows = row_count;

  if affected_rows <> 1 then
    raise exception 'Financial note was not saved';
  end if;

  if p_delete_confirmed_transactions then
    delete from public.confirmed_transactions
    where user_id = p_user_id
      and note_id = p_note_id;
  end if;
end;
$$;

create or replace function public.confirm_financial_note(
  p_user_id uuid,
  p_note_id uuid,
  p_folder text,
  p_title text,
  p_body text,
  p_created_at timestamptz,
  p_updated_at timestamptz,
  p_analysis jsonb,
  p_confirmed_transaction_ids uuid[],
  p_pending_reconfirmation boolean,
  p_transactions jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  expected_count integer;
  inserted_count integer;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Not allowed to confirm financial note';
  end if;

  if coalesce(jsonb_typeof(p_transactions), '') <> 'array' then
    raise exception 'Confirmed transactions payload must be an array';
  end if;

  expected_count := jsonb_array_length(p_transactions);

  if expected_count <= 0 then
    raise exception 'Confirmed transactions payload cannot be empty';
  end if;

  perform public.save_financial_note_draft(
    p_user_id,
    p_note_id,
    p_folder,
    p_title,
    p_body,
    p_created_at,
    p_updated_at,
    p_analysis,
    p_confirmed_transaction_ids,
    coalesce(p_pending_reconfirmation, false),
    true
  );

  insert into public.confirmed_transactions (
    id,
    user_id,
    note_id,
    note_title,
    type,
    amount,
    currency,
    category,
    date,
    recurring,
    impulse,
    core_expense,
    intent,
    freedom_impact,
    source_text,
    income_increase,
    ignored,
    debt,
    anti_error_review,
    confirmed_at
  )
  select
    tx.id::uuid,
    p_user_id,
    tx.note_id::uuid,
    tx.note_title,
    tx.type,
    tx.amount,
    tx.currency,
    tx.category,
    tx.date,
    tx.recurring,
    tx.impulse,
    tx.core_expense,
    tx.intent,
    tx.freedom_impact,
    tx.source_text,
    tx.income_increase,
    tx.ignored,
    tx.debt,
    tx.anti_error_review,
    tx.confirmed_at
  from jsonb_to_recordset(p_transactions) as tx(
    id text,
    note_id text,
    note_title text,
    type text,
    amount numeric,
    currency text,
    category text,
    date date,
    recurring boolean,
    impulse boolean,
    core_expense boolean,
    intent text,
    freedom_impact numeric,
    source_text text,
    income_increase boolean,
    ignored boolean,
    debt jsonb,
    anti_error_review jsonb,
    confirmed_at timestamptz
  )
  where tx.note_id::uuid = p_note_id;

  get diagnostics inserted_count = row_count;

  if inserted_count <> expected_count then
    raise exception 'Confirmed transactions did not match the note';
  end if;
end;
$$;

grant execute on function public.save_financial_note_draft(
  uuid,
  uuid,
  text,
  text,
  text,
  timestamptz,
  timestamptz,
  jsonb,
  uuid[],
  boolean,
  boolean
) to authenticated;

grant execute on function public.confirm_financial_note(
  uuid,
  uuid,
  text,
  text,
  text,
  timestamptz,
  timestamptz,
  jsonb,
  uuid[],
  boolean,
  jsonb
) to authenticated;
