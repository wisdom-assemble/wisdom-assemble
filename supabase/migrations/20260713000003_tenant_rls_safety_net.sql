-- ============================================================
-- RLSにテナント制約の安全網を追加
-- アプリ側で.eq('tenant_id', ...)を書き忘れても、DB側で
-- 別テナントの行が返らないようにする保険。
--
-- 設計方針（安全第一）：
-- リクエストヘッダー x-tenant-id をPostgREST経由でDBに渡し、
-- 現在のテナントと一致する行だけをSELECT許可する。
-- ただしヘッダーが未設定（''）の場合はフェイルオープン
-- （＝今までどおり制限なし）とし、既存動作を壊さないようにする。
-- サービスロール（管理者API等）はRLS自体の対象外なので影響なし。
-- ============================================================

create or replace function current_tenant_id() returns text
language sql stable as $$
  select coalesce(nullif(current_setting('request.headers', true)::json->>'x-tenant-id', ''), '')
$$;

drop policy if exists "questions_read" on questions;
create policy "questions_read" on questions for select
  using (current_tenant_id() = '' or tenant_id = current_tenant_id());

drop policy if exists "answers_read" on answers;
create policy "answers_read" on answers for select
  using (current_tenant_id() = '' or tenant_id = current_tenant_id());

drop policy if exists "tenant_profiles_read" on tenant_profiles;
create policy "tenant_profiles_read" on tenant_profiles for select
  using (current_tenant_id() = '' or tenant_id = current_tenant_id());

-- user_titlesにはread専用ポリシーが無かったため新規追加
drop policy if exists "user_titles_read" on user_titles;
alter table user_titles enable row level security;
create policy "user_titles_read" on user_titles for select
  using (current_tenant_id() = '' or tenant_id = current_tenant_id());
