-- ============================================================
-- AIコスト管理＋ダッシュボード拡張
-- ------------------------------------------------------------
-- ・ai_usage: Groq使用量の日次ログ(テナント別)。ダッシュボードのコスト表示用。
-- ・ai_budget: 1日のAI質問数の自主上限(全体)。Groq無料枠より低く設定し先に当てる。
-- ・daily_revenue: 収益の汎用stub(AdSense/Stripe/アフィリ。承認後に接続・形は将来変わりうる)。
-- ・check_and_reserve_ai_budget / record_ai_tokens: 質問フロー用RPC(service_roleのみ)。
-- ・admin_dashboard_stats: 人間ルーティング率・タグ集計・テナント数・本日のAI使用/上限・
--   収益 を追加(全テナント横断・JST)。
-- 全て service_role からのみ利用(一般ロールへのGRANTは不要)。
-- ============================================================

-- Groq使用量の日次ログ(テナント別)
create table if not exists ai_usage (
  day               date   not null,
  tenant_id         text   not null,
  calls             int    not null default 0,
  prompt_tokens     bigint not null default 0,
  completion_tokens bigint not null default 0,
  est_cost_usd      numeric not null default 0,
  primary key (day, tenant_id)
);
grant select, insert, update on ai_usage to service_role;

-- 1日のAI質問数の自主上限(全体・1行)
create table if not exists ai_budget (
  id                  int primary key default 1,
  daily_question_cap  int not null default 60,
  updated_at          timestamptz not null default now(),
  constraint ai_budget_single check (id = 1)
);
insert into ai_budget (id, daily_question_cap) values (1, 60) on conflict (id) do nothing;
grant select, update on ai_budget to service_role;

-- 収益の汎用stub(承認後に接続。amount_jpyは日次のソース別金額)
create table if not exists daily_revenue (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  text,
  date       date not null,
  source     text not null check (source in ('adsense', 'stripe', 'affiliate')),
  amount_jpy numeric not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert, update on daily_revenue to service_role;

-- AI呼び出し前: 本日(JST)の全体AI質問数 < cap を判定し、通過ならcallsを+1して予約。
-- 返り値: {allowed, remaining, cap, reset_at(翌JST0時)}。
create or replace function check_and_reserve_ai_budget(p_tenant_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_cap int; v_today date; v_total int; v_reset timestamptz;
begin
  select daily_question_cap into v_cap from ai_budget where id = 1;
  v_cap := coalesce(v_cap, 60);
  v_today := (now() at time zone 'Asia/Tokyo')::date;
  v_reset := ((v_today + 1)::timestamp) at time zone 'Asia/Tokyo';
  select coalesce(sum(calls), 0) into v_total from ai_usage where day = v_today;
  if v_total >= v_cap then
    return jsonb_build_object('allowed', false, 'remaining', 0, 'cap', v_cap, 'reset_at', v_reset);
  end if;
  insert into ai_usage (day, tenant_id, calls) values (v_today, p_tenant_id, 1)
    on conflict (day, tenant_id) do update set calls = ai_usage.calls + 1;
  return jsonb_build_object('allowed', true, 'remaining', v_cap - v_total - 1, 'cap', v_cap, 'reset_at', v_reset);
end $$;
revoke execute on function check_and_reserve_ai_budget(text) from public, anon, authenticated;
grant execute on function check_and_reserve_ai_budget(text) to service_role;

-- AI呼び出し成功後: トークン数/推定コストを本日(JST)のテナント行に加算。
create or replace function record_ai_tokens(p_tenant_id text, p_prompt bigint, p_completion bigint, p_cost numeric)
returns void language plpgsql security definer set search_path = public as $$
declare v_today date;
begin
  v_today := (now() at time zone 'Asia/Tokyo')::date;
  insert into ai_usage (day, tenant_id, prompt_tokens, completion_tokens, est_cost_usd)
    values (v_today, p_tenant_id, p_prompt, p_completion, p_cost)
  on conflict (day, tenant_id) do update set
    prompt_tokens = ai_usage.prompt_tokens + excluded.prompt_tokens,
    completion_tokens = ai_usage.completion_tokens + excluded.completion_tokens,
    est_cost_usd = ai_usage.est_cost_usd + excluded.est_cost_usd;
end $$;
revoke execute on function record_ai_tokens(text, bigint, bigint, numeric) from public, anon, authenticated;
grant execute on function record_ai_tokens(text, bigint, bigint, numeric) to service_role;

-- ダッシュボード集計に「ルーティング率・タグ・テナント数・本日AI使用/上限・収益」を追加
create or replace function admin_dashboard_stats()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'totals', (
      select jsonb_build_object(
        'questions',     (select count(*) from questions),
        'users',         (select count(*) from profiles),
        'answers',       (select count(*) from answers),
        'ai_answers',    (select count(*) from answers where is_ai),
        'human_answers', (select count(*) from answers where not is_ai),
        'solved',        (select count(*) from questions where status = 'solved'),
        'unsolved',      (select count(*) from questions where status <> 'solved'),
        'hard',          (select count(*) from questions where status = 'hard'),
        'views',         (select coalesce(sum(view_count), 0) from questions),
        'tenant_count',  (select count(*) from tenants),
        'routed',        (select count(*) from questions where matched_b_id is not null)
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
        'calls',    coalesce((select sum(calls) from ai_usage where day = (now() at time zone 'Asia/Tokyo')::date), 0),
        'cost_usd', coalesce((select sum(est_cost_usd) from ai_usage where day = (now() at time zone 'Asia/Tokyo')::date), 0),
        'cap',      coalesce((select daily_question_cap from ai_budget where id = 1), 60)
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
