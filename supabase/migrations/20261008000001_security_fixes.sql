-- 【2026-10-08】セキュリティ修正（コード調査で発見）。Supabase → SQL Editor の新規タブに全部貼って Run。
-- アプリの書き込み・管理画面はすべて service_role 経由なので、サイトの動きは変わらない。何度実行しても同じ結果になる。

-- ① 質問者のIPアドレスを消す（公開用の鍵で誰でも読めていた。今後はコード側で保存しない）
update public.questions set ip_address = null where ip_address is not null;

-- ② ブラウザから質問を直接書き換えられないようにする（自分の質問の状態・タグ等を自由に変更できていた）
drop policy if exists "questions_update" on public.questions;
revoke update on public.questions from anon, authenticated;

-- ③ AIの使用量・上限・売上・アラートの表に鍵をかける（RLSが無く、公開用の鍵で読み書きできる可能性があった）
alter table if exists public.ai_usage      enable row level security;
alter table if exists public.ai_budget     enable row level security;
alter table if exists public.daily_revenue enable row level security;
alter table if exists public.ai_alert_log  enable row level security;
revoke all on public.ai_usage, public.ai_budget, public.daily_revenue, public.ai_alert_log from anon, authenticated;

-- ④ 称号の一覧は「読むだけ」にする（画面で称号名を表示するので読み取りは残す）
alter table if exists public.titles enable row level security;
drop policy if exists "titles_read_all" on public.titles;
create policy "titles_read_all" on public.titles for select using (true);
revoke insert, update, delete on public.titles from anon, authenticated;

-- ⑤ 同じ人が同じ質問に2回回答できないようにする（同時に2回送ると二重に入っていた）
create unique index if not exists answers_one_human_answer_per_user
  on public.answers (question_id, user_id) where not is_ai;

-- 確認：rls_on がすべて true、anon_read・anon_write・auth_update が false（空欄はOK）、ip_left が 0 ならOK
select c.relname as table_name,
       c.relrowsecurity as rls_on,
       case when c.relname in ('titles','questions') then null else has_table_privilege('anon', c.oid, 'select') end as anon_read,
       has_table_privilege('anon', c.oid, 'update') as anon_write,
       has_table_privilege('authenticated', c.oid, 'update') as auth_update,
       (select count(*) from public.questions where ip_address is not null) as ip_left
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('ai_usage','ai_budget','daily_revenue','ai_alert_log','titles','questions')
order by 1;
