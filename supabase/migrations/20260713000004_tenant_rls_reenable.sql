-- ============================================================
-- RLS安全網の再有効化
-- 20260713000003で追加したテナント制約は、原因究明のため
-- 一旦フェイルオープン(using true)にロールバックしていた。
-- 実際の原因はtenant_profilesへのGRANT不足であり、RLS自体は
-- 無関係だったと判明したため、テナント制約を再度有効化する。
-- ============================================================

drop policy if exists "questions_read" on questions;
create policy "questions_read" on questions for select
  using (current_tenant_id() = '' or tenant_id = current_tenant_id());

drop policy if exists "answers_read" on answers;
create policy "answers_read" on answers for select
  using (current_tenant_id() = '' or tenant_id = current_tenant_id());

drop policy if exists "tenant_profiles_read" on tenant_profiles;
create policy "tenant_profiles_read" on tenant_profiles for select
  using (current_tenant_id() = '' or tenant_id = current_tenant_id());

drop policy if exists "user_titles_read" on user_titles;
create policy "user_titles_read" on user_titles for select
  using (current_tenant_id() = '' or tenant_id = current_tenant_id());
