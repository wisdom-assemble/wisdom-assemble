-- ============================================================
-- ダッシュボードの「稼働テナント数」を実態に合わせる。
--  旧: tenant_count = count(*) from tenants（下書き含む全登録数＝実態と乖離）
--  新: tenant_count      = 質問が1件以上ある（＝実際に稼働している）テナント数
--      tenant_registered = tenants テーブルの登録総数（下書き含む・補足表示用）
-- admin_dashboard_stats() の totals ブロックのみ差し替え（他は据え置き）。
-- ============================================================
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
