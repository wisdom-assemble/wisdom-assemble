-- 質問投稿レート制限の再設計（2026-07-09 Notion仕様）
-- 旧テーブルはip_address+tenant_idのみでコード側から一切参照されておらず未使用のため置き換える。
-- グローバル制限（1ユーザー1日10件・全テナント横断）とテナント別制限（1ユーザー1テナント1日3件）を
-- 同一テーブルで scope 列（'global' または tenant_id）により管理する。

drop table if exists rate_limits;

create table rate_limits (
  user_id        uuid        not null references auth.users(id) on delete cascade,
  scope          text        not null, -- 'global' または tenant_id
  question_count int         not null default 0,
  window_start   timestamptz not null default now(),
  primary key (user_id, scope)
);

alter table rate_limits enable row level security;
-- 参照・更新はcheck_and_increment_rate_limit（security definer）経由のみ。直接のクライアントアクセスは許可しない。

create or replace function check_and_increment_rate_limit(p_user_id uuid, p_tenant_id text)
returns boolean
language plpgsql
security definer
as $$
declare
  v_global_count  int;
  v_global_window timestamptz;
  v_tenant_count  int;
  v_tenant_window timestamptz;
begin
  insert into rate_limits (user_id, scope, question_count, window_start)
  values (p_user_id, 'global', 0, now())
  on conflict (user_id, scope) do nothing;

  select question_count, window_start into v_global_count, v_global_window
  from rate_limits where user_id = p_user_id and scope = 'global' for update;

  if v_global_window < now() - interval '24 hours' then
    v_global_count := 0;
    update rate_limits set question_count = 0, window_start = now()
      where user_id = p_user_id and scope = 'global';
  end if;

  if v_global_count >= 10 then
    return false;
  end if;

  insert into rate_limits (user_id, scope, question_count, window_start)
  values (p_user_id, p_tenant_id, 0, now())
  on conflict (user_id, scope) do nothing;

  select question_count, window_start into v_tenant_count, v_tenant_window
  from rate_limits where user_id = p_user_id and scope = p_tenant_id for update;

  if v_tenant_window < now() - interval '24 hours' then
    v_tenant_count := 0;
    update rate_limits set question_count = 0, window_start = now()
      where user_id = p_user_id and scope = p_tenant_id;
  end if;

  if v_tenant_count >= 3 then
    return false;
  end if;

  update rate_limits set question_count = question_count + 1
    where user_id = p_user_id and scope = 'global';
  update rate_limits set question_count = question_count + 1
    where user_id = p_user_id and scope = p_tenant_id;

  return true;
end;
$$;
