-- 【2026-10-08】DBの修正 その2。Supabase → SQL Editor の新規タブに全部貼って Run。何度実行しても同じ結果。

-- ① 質問の「最終更新日時」を、閲覧数の加算や質問者の確認では変えない（サイトマップの更新日時に使われるため）
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  if tg_table_name = 'questions'
     and new.updated_at is not distinct from old.updated_at
     and (to_jsonb(new) - array['view_count','updated_at','owner_reviewed_at'])
         = (to_jsonb(old) - array['view_count','updated_at','owner_reviewed_at']) then
    return new;
  end if;
  new.updated_at = now();
  return new;
end $$;

-- ② 人間の回答が付いた・編集されたら、質問の最終更新日時を新しくする（Googleに更新を伝える）
create or replace function public.touch_question_on_answer()
returns trigger language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  if new.is_ai = false then
    update public.questions set updated_at = now() where id = new.question_id;
  end if;
  return new;
end $$;
drop trigger if exists on_answer_touch_question on public.answers;
create trigger on_answer_touch_question
  after insert or update of body on public.answers
  for each row execute function public.touch_question_on_answer();

-- ③ 回答を消したら、その人の回答数を1つ戻す（以前は戻らなかった）
create or replace function public.handle_deleted_answer()
returns trigger language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  if old.is_ai = false and old.user_id is not null then
    update public.tenant_profiles set answer_count = greatest(answer_count - 1, 0)
     where tenant_id = old.tenant_id and user_id = old.user_id;
  end if;
  return old;
end $$;
drop trigger if exists on_answer_deleted on public.answers;
create trigger on_answer_deleted
  after delete on public.answers
  for each row execute function public.handle_deleted_answer();

-- ④ 特権で動く関数の「名前の探し先」を固定する（8/16のログイン障害と同じ壊れ方を防ぐ）
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
      and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')
  loop
    execute format('alter function %s set search_path = public, extensions, pg_temp', r.sig);
  end loop;
end $$;

-- 確認：fixed_functions は 0 以外、unpinned_left が 0、triggers が 2 ならOK
select
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
      and exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')) as fixed_functions,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
      and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')) as unpinned_left,
  (select count(*) from pg_trigger where tgname in ('on_answer_touch_question','on_answer_deleted')) as triggers;
