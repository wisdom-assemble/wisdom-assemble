-- ============================================================
-- AI上限のオン/オフ（無料プラン=制限なし / 有料プラン=上限適用）＋ダッシュボードから変更
--  ・ai_budget.cap_enabled: false=上限オフ（無料・AIは自然にGroq無料枠で頭打ち）
--                           true =上限オン（有料・capを超えたら人間ルーティング）
--  ・check_and_reserve_ai_budget: cap_enabled=false なら常にallowed（集計callsは加算・reset_atは常に返す）
--  ・set_ai_budget(cap, enabled): 管理ダッシュボードから上限値/オンオフを更新
--  ・admin_dashboard_stats.ai_today に cap_enabled を追加
-- 既定は false（現在は無料プランのため制限なし）。
-- 注: 無料プランでもGroq自身が無料枠超過で429を返して自動的に止まる。うちのコードは
--     それを検知して人間ルーティングへ切り替え、投稿者には reset_at 付きモーダルを出す。
-- ============================================================
alter table ai_budget add column if not exists cap_enabled boolean not null default false;

-- AI呼び出し前の予算判定。
--  上限オフ: 常に許可（集計用にcallsのみ加算）。reset_at は翌JST0時を常に返す。
--  上限オン: 本日(JST)の全体AI質問数 < cap を判定し、通過ならcallsを+1して予約。
create or replace function check_and_reserve_ai_budget(p_tenant_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_cap int; v_enabled boolean; v_today date; v_total int; v_reset timestamptz;
begin
  select daily_question_cap, cap_enabled into v_cap, v_enabled from ai_budget where id = 1;
  v_cap := coalesce(v_cap, 60);
  v_enabled := coalesce(v_enabled, false);
  v_today := (now() at time zone 'Asia/Tokyo')::date;
  v_reset := ((v_today + 1)::timestamp) at time zone 'Asia/Tokyo';
  select coalesce(sum(calls), 0) into v_total from ai_usage where day = v_today;

  -- 上限オフ（無料プラン）: 常に許可。集計用にcallsのみ加算する。
  if not v_enabled then
    insert into ai_usage (day, tenant_id, calls) values (v_today, p_tenant_id, 1)
      on conflict (day, tenant_id) do update set calls = ai_usage.calls + 1;
    return jsonb_build_object('allowed', true, 'enabled', false, 'remaining', null, 'cap', v_cap, 'reset_at', v_reset);
  end if;

  -- 上限オン（有料プラン）: capに達していたら不許可（人間ルーティングへ）。
  if v_total >= v_cap then
    return jsonb_build_object('allowed', false, 'enabled', true, 'remaining', 0, 'cap', v_cap, 'reset_at', v_reset);
  end if;
  insert into ai_usage (day, tenant_id, calls) values (v_today, p_tenant_id, 1)
    on conflict (day, tenant_id) do update set calls = ai_usage.calls + 1;
  return jsonb_build_object('allowed', true, 'enabled', true, 'remaining', v_cap - v_total - 1, 'cap', v_cap, 'reset_at', v_reset);
end $$;
revoke execute on function check_and_reserve_ai_budget(text) from public, anon, authenticated;
grant  execute on function check_and_reserve_ai_budget(text) to service_role;

-- 管理ダッシュボードから上限値・オンオフを更新する（service_roleのみ＝admin API経由）
create or replace function set_ai_budget(p_cap int, p_enabled boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_cap int; v_enabled boolean;
begin
  update ai_budget set
    daily_question_cap = greatest(1, coalesce(p_cap, daily_question_cap)),
    cap_enabled        = coalesce(p_enabled, cap_enabled),
    updated_at         = now()
  where id = 1
  returning daily_question_cap, cap_enabled into v_cap, v_enabled;
  return jsonb_build_object('cap', v_cap, 'enabled', v_enabled);
end $$;
revoke execute on function set_ai_budget(int, boolean) from public, anon, authenticated;
grant  execute on function set_ai_budget(int, boolean) to service_role;

-- ダッシュボード集計：ai_today に cap_enabled を追加（他ブロックは 20260720000004 と同一）
create or replace function admin_dashboard_stats()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'totals', (
      select jsonb_build_object(
        'questions',         (select count(*) from questions),
        'users',             (select count(*) from profiles),
        'answers',           (select count(*) from answers),
        'ai_answers',        (select count(*) from answers where is_ai),
        'human_answers',     (select count(*) from answers where not is_ai),
        'solved',            (select count(*) from questions where status = 'solved'),
        'unsolved',          (select count(*) from questions where status <> 'solved'),
        'hard',              (select count(*) from questions where status = 'hard'),
        'views',             (select coalesce(sum(view_count), 0) from questions),
        'tenant_count',      (select count(distinct tenant_id) from questions),
        'tenant_registered', (select count(*) from tenants),
        'routed',            (select count(*) from questions where matched_b_id is not null)
      )
    ),
    'per_tenant', (
      select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      from (
        select
          q.tenant_id                                                        as tenant_id,
          count(*)                                                           as questions,
          count(*) filter (where q.status = 'solved')                        as solved,
          count(*) filter (where q.status = 'hard')                          as hard,
          count(*) filter (where q.status <> 'solved')                       as unsolved,
          count(*) filter (where q.matched_b_id is not null)                 as routed,
          count(*) filter (where q.created_at >= now() - interval '7 days')  as q_7d,
          count(*) filter (where q.created_at >= now() - interval '30 days') as q_30d,
          coalesce(sum(q.view_count), 0)                                     as views,
          round(
            avg(extract(epoch from (q.solved_at - q.created_at)) / 3600.0)
              filter (where q.status = 'solved' and q.solved_at is not null)::numeric,
            1
          )                                                                  as avg_solve_hours,
          (select count(*) from answers a where a.tenant_id = q.tenant_id and a.is_ai)      as ai_answers,
          (select count(*) from answers a where a.tenant_id = q.tenant_id and not a.is_ai)  as human_answers,
          (select count(distinct a.user_id) from answers a
             where a.tenant_id = q.tenant_id and not a.is_ai and a.user_id is not null)     as answerers,
          coalesce((select sum(u.est_cost_usd) from ai_usage u where u.tenant_id = q.tenant_id), 0) as ai_cost_usd
        from questions q
        group by q.tenant_id
        order by count(*) desc
      ) t
    ),
    'dau', (
      with act as (
        select user_id, (created_at at time zone 'Asia/Tokyo')::date as d
          from questions where user_id is not null and created_at >= now() - interval '30 days'
        union all
        select user_id, (created_at at time zone 'Asia/Tokyo')::date as d
          from answers where user_id is not null and not is_ai and created_at >= now() - interval '30 days'
      )
      select coalesce(jsonb_agg(jsonb_build_object('day', to_char(d, 'YYYY-MM-DD'), 'count', c) order by d), '[]'::jsonb)
      from (select d, count(distinct user_id) as c from act group by d) z
    ),
    'mau', (
      with act as (
        select user_id, to_char((created_at at time zone 'Asia/Tokyo'), 'YYYY-MM') as m
          from questions where user_id is not null and created_at >= now() - interval '12 months'
        union all
        select user_id, to_char((created_at at time zone 'Asia/Tokyo'), 'YYYY-MM') as m
          from answers where user_id is not null and not is_ai and created_at >= now() - interval '12 months'
      )
      select coalesce(jsonb_agg(jsonb_build_object('month', m, 'count', c) order by m), '[]'::jsonb)
      from (select m, count(distinct user_id) as c from act group by m) z
    ),
    'tags', (
      select coalesce(jsonb_agg(jsonb_build_object('tag', tag, 'count', c) order by c desc), '[]'::jsonb)
      from (
        select tag, count(*) as c
        from (select unnest(tags) as tag from questions where tags is not null) x
        where tag is not null and tag <> ''
        group by tag order by count(*) desc limit 25
      ) y
    ),
    'ai_today', (
      select jsonb_build_object(
        'calls',       coalesce((select sum(calls) from ai_usage where day = (now() at time zone 'Asia/Tokyo')::date), 0),
        'cost_usd',    coalesce((select sum(est_cost_usd) from ai_usage where day = (now() at time zone 'Asia/Tokyo')::date), 0),
        'cap',         coalesce((select daily_question_cap from ai_budget where id = 1), 60),
        'cap_enabled', coalesce((select cap_enabled from ai_budget where id = 1), false)
      )
    ),
    'revenue', (
      select jsonb_build_object(
        'total_jpy', coalesce((select sum(amount_jpy) from daily_revenue), 0),
        'by_source', coalesce((select jsonb_object_agg(source, s) from (select source, sum(amount_jpy) as s from daily_revenue group by source) r), '{}'::jsonb)
      )
    )
  )
  into result;
  return result;
end $$;
revoke execute on function admin_dashboard_stats() from public, anon, authenticated;
grant  execute on function admin_dashboard_stats() to service_role;
