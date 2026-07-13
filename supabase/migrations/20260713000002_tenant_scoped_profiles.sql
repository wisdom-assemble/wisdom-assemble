-- ============================================================
-- テナント別プロフィール分離
-- 称号・実績カウント・スキルタグ・稼働状態・通知設定・表示名・
-- ユーザー名を「ユーザー×テナント」単位に分離する。
-- profiles には認証まわり（id/is_banned/created_at/language）だけ残す。
-- ============================================================

-- 1. tenant_profiles テーブル作成
create table if not exists tenant_profiles (
  tenant_id             text        not null references tenants(id),
  user_id               uuid        not null references profiles(id) on delete cascade,
  display_name          text,
  username              text,
  skill_tags            text[]      not null default '{}',
  answered_tags         text[]      not null default '{}',
  is_available          boolean     not null default true,
  email_notify          boolean     not null default true,
  answer_count          int         not null default 0,
  hard_quest_count      int         not null default 0,
  question_count        int         not null default 0,
  solved_question_count int         not null default 0,
  active_title_id       text        references titles(id),
  created_at            timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create unique index if not exists tenant_profiles_username_unique
  on tenant_profiles (tenant_id, username) where username is not null;

alter table tenant_profiles enable row level security;
create policy "tenant_profiles_read"   on tenant_profiles for select using (true);
create policy "tenant_profiles_insert" on tenant_profiles for insert with check (auth.uid() = user_id);
create policy "tenant_profiles_update" on tenant_profiles for update using (auth.uid() = user_id);

-- 2. user_titles にtenant_idを追加し、複合キーに変更
alter table user_titles add column if not exists tenant_id text references tenants(id);

-- 3. 既存データのバックフィル（debug/dtmの2テナント分）
--    display_name/username/skill_tags/answered_tags/is_available/email_notifyは
--    過去のテナント別履歴が存在しないため、現行のprofiles値をそのまま初期値として複製する。
--    answer_count/question_count/solved_question_countはquestions/answersのtenant_idから
--    正確に再集計できるためそちらを採用する。hard_quest_countのみ、hard状態を経て
--    solvedになった質問の解決者数から近似する（当時の正確な判定条件は履歴が残っていないため近似値）。
do $$
declare
  r record;
  v_tenant text;
begin
  for r in select id, display_name, username, skill_tags, answered_tags, is_available, email_notify from profiles loop
    foreach v_tenant in array array['debug', 'dtm'] loop
      insert into tenant_profiles (
        tenant_id, user_id, display_name, username, skill_tags, answered_tags,
        is_available, email_notify, answer_count, question_count, solved_question_count, hard_quest_count
      )
      values (
        v_tenant, r.id, r.display_name, r.username, coalesce(r.skill_tags, '{}'), coalesce(r.answered_tags, '{}'),
        coalesce(r.is_available, true), coalesce(r.email_notify, true),
        (select count(*) from answers a where a.user_id = r.id and a.tenant_id = v_tenant and a.is_ai = false and a.is_accepted = true),
        (select count(*) from questions q where q.user_id = r.id and q.tenant_id = v_tenant),
        (select count(*) from questions q where q.user_id = r.id and q.tenant_id = v_tenant and q.status = 'solved'),
        (select count(*) from questions q where q.tenant_id = v_tenant and q.status = 'solved' and q.matched_c_id is not null and q.solved_by = r.id)
      )
      on conflict (tenant_id, user_id) do nothing;
    end loop;
  end loop;
end;
$$;

-- 4. RPC関数をテナント別に更新
create or replace function increment_answer_count(uid uuid, p_tenant_id text)
returns void language plpgsql security definer as $$
begin
  insert into tenant_profiles (tenant_id, user_id, answer_count)
  values (p_tenant_id, uid, 1)
  on conflict (tenant_id, user_id) do update set answer_count = tenant_profiles.answer_count + 1;
end;
$$;

create or replace function increment_hard_quest_count(uid uuid, p_tenant_id text)
returns void language plpgsql security definer as $$
begin
  insert into tenant_profiles (tenant_id, user_id, hard_quest_count)
  values (p_tenant_id, uid, 1)
  on conflict (tenant_id, user_id) do update set hard_quest_count = tenant_profiles.hard_quest_count + 1;
end;
$$;

create or replace function increment_question_count(uid uuid, p_tenant_id text)
returns void language plpgsql security definer as $$
begin
  insert into tenant_profiles (tenant_id, user_id, question_count)
  values (p_tenant_id, uid, 1)
  on conflict (tenant_id, user_id) do update set question_count = tenant_profiles.question_count + 1;
end;
$$;

create or replace function increment_solved_question_count(uid uuid, p_tenant_id text)
returns void language plpgsql security definer as $$
begin
  insert into tenant_profiles (tenant_id, user_id, solved_question_count)
  values (p_tenant_id, uid, 1)
  on conflict (tenant_id, user_id) do update set solved_question_count = tenant_profiles.solved_question_count + 1;
end;
$$;

-- 5. check_and_award_titles をテナント別に更新
create or replace function check_and_award_titles(p_user_id uuid, p_tenant_id text)
returns void language plpgsql security definer as $$
declare
  v_answer_count          int;
  v_hard_quest_count      int;
  v_question_count        int;
  v_solved_question_count int;
  v_title                 record;
  v_best_title_id         text;
begin
  select answer_count, hard_quest_count, question_count, solved_question_count
    into v_answer_count, v_hard_quest_count, v_question_count, v_solved_question_count
    from tenant_profiles where tenant_id = p_tenant_id and user_id = p_user_id;

  for v_title in select id, condition_type, condition_value from titles loop
    if v_title.condition_type = 'answer_count' and v_answer_count >= v_title.condition_value then
      insert into user_titles (user_id, title_id, tenant_id) values (p_user_id, v_title.id, p_tenant_id) on conflict do nothing;
    end if;
    if v_title.condition_type = 'hard_quest' and v_hard_quest_count >= v_title.condition_value then
      insert into user_titles (user_id, title_id, tenant_id) values (p_user_id, v_title.id, p_tenant_id) on conflict do nothing;
    end if;
    if v_title.condition_type = 'question_count' and v_question_count >= v_title.condition_value then
      insert into user_titles (user_id, title_id, tenant_id) values (p_user_id, v_title.id, p_tenant_id) on conflict do nothing;
    end if;
    if v_title.condition_type = 'solved_question_count' and v_solved_question_count >= v_title.condition_value then
      insert into user_titles (user_id, title_id, tenant_id) values (p_user_id, v_title.id, p_tenant_id) on conflict do nothing;
    end if;
  end loop;

  select t.id into v_best_title_id
    from user_titles ut
    join titles t on t.id = ut.title_id
    where ut.user_id = p_user_id and ut.tenant_id = p_tenant_id
    order by
      case t.rarity when 'legendary' then 3 when 'rare' then 2 when 'common' then 1 else 0 end desc,
      t.condition_value desc nulls last
    limit 1;

  if v_best_title_id is not null then
    update tenant_profiles set active_title_id = v_best_title_id
    where tenant_id = p_tenant_id and user_id = p_user_id
      and (active_title_id is null or active_title_id != v_best_title_id);
  end if;
end;
$$;

-- 6. 既存ユーザーのuser_titlesをテナント別に再計算（バックフィルした実績値ベース）
do $$
declare
  r record;
  v_tenant text;
begin
  for r in select distinct user_id from tenant_profiles loop
    foreach v_tenant in array array['debug', 'dtm'] loop
      perform check_and_award_titles(r.user_id, v_tenant);
    end loop;
  end loop;
end;
$$;

-- 7. 旧仕様（テナント非依存）のuser_titles行は上記6で再計算済みのため削除し、
--    以後は(tenant_id, user_id, title_id)の複合キーで運用する
delete from user_titles where tenant_id is null;
alter table user_titles alter column tenant_id set not null;
alter table user_titles drop constraint if exists user_titles_pkey;
alter table user_titles add primary key (tenant_id, user_id, title_id);

-- 8. 移行済みのグローバルカラム（profiles.skill_tags等）はコード側の参照を
--    切り替えた後、別マイグレーションで削除する（このマイグレーションでは
--    残す＝ロールバック安全のため）
