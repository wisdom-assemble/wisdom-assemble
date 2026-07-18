-- ============================================================
-- 管理者ダッシュボード用 全テナント横断KPI集計RPC
-- ------------------------------------------------------------
-- read-only。service_roleからのみ呼ぶ（/adminのサーバーコンポーネント）。
-- 全テナントを串刺しで集計するためRLSを迂回する必要があり、
-- 呼び出し側は必ず createAdminClient()（service_role）を使うこと。
-- DAU/MAUの日境界は運営が日本のため Asia/Tokyo（JST）で束ねる。
-- 集計はSQL側（インデックス利用）で行うので質問数が増えても軽い。
-- ============================================================

create or replace function admin_dashboard_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    -- 全体サマリー ------------------------------------------------
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
        'views',         (select coalesce(sum(view_count), 0) from questions)
      )
    ),

    -- テナント別サマリー ------------------------------------------
    'per_tenant', (
      select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      from (
        select
          q.tenant_id                                                              as tenant_id,
          count(*)                                                                 as questions,
          count(*) filter (where q.status = 'solved')                              as solved,
          count(*) filter (where q.status = 'hard')                                as hard,
          count(*) filter (where q.status <> 'solved')                             as unsolved,
          count(*) filter (where q.created_at >= now() - interval '7 days')        as q_7d,
          count(*) filter (where q.created_at >= now() - interval '30 days')       as q_30d,
          coalesce(sum(q.view_count), 0)                                           as views,
          round(
            avg(extract(epoch from (q.solved_at - q.created_at)) / 3600.0)
              filter (where q.status = 'solved' and q.solved_at is not null)::numeric,
            1
          )                                                                        as avg_solve_hours,
          (select count(*) from answers a
             where a.tenant_id = q.tenant_id and a.is_ai)                          as ai_answers,
          (select count(*) from answers a
             where a.tenant_id = q.tenant_id and not a.is_ai)                      as human_answers,
          (select count(distinct a.user_id) from answers a
             where a.tenant_id = q.tenant_id and not a.is_ai
               and a.user_id is not null)                                         as answerers
        from questions q
        group by q.tenant_id
        order by count(*) desc
      ) t
    ),

    -- DAU（直近30日・JST日別のアクティブ投稿者数＝質問 or 人間回答をした一意ユーザー）
    'dau', (
      with act as (
        select user_id, (created_at at time zone 'Asia/Tokyo')::date as d
          from questions
          where user_id is not null and created_at >= now() - interval '30 days'
        union all
        select user_id, (created_at at time zone 'Asia/Tokyo')::date as d
          from answers
          where user_id is not null and not is_ai and created_at >= now() - interval '30 days'
      )
      select coalesce(
        jsonb_agg(jsonb_build_object('day', to_char(d, 'YYYY-MM-DD'), 'count', c) order by d),
        '[]'::jsonb
      )
      from (select d, count(distinct user_id) as c from act group by d) z
    ),

    -- MAU（直近12ヶ月・JST月別のアクティブ投稿者数）
    'mau', (
      with act as (
        select user_id, to_char((created_at at time zone 'Asia/Tokyo'), 'YYYY-MM') as m
          from questions
          where user_id is not null and created_at >= now() - interval '12 months'
        union all
        select user_id, to_char((created_at at time zone 'Asia/Tokyo'), 'YYYY-MM') as m
          from answers
          where user_id is not null and not is_ai and created_at >= now() - interval '12 months'
      )
      select coalesce(
        jsonb_agg(jsonb_build_object('month', m, 'count', c) order by m),
        '[]'::jsonb
      )
      from (select m, count(distinct user_id) as c from act group by m) z
    )
  )
  into result;

  return result;
end;
$$;

-- 全テナント横断の集計を返すため、一般ロールからは実行不可にする
revoke execute on function admin_dashboard_stats() from public, anon, authenticated;
grant  execute on function admin_dashboard_stats() to service_role;
