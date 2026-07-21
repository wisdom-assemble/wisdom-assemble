-- ============================================================
-- (1) 閲覧数インクリメントをRLS迂回のRPCに（2026-07-17のlock-downで
--     questions_update=auth.uid()=user_id になり、質問所有者以外・匿名の閲覧で
--     view_countが増えなくなっていた＝閲覧数が過少集計）。security definerで
--     所有者チェック無しにview_countのみ+1する。anon/authenticatedから実行可。
-- (2) service_role に tenant_profiles の INSERT/UPDATE を付与（新設時にSELECTしか
--     付けておらず、ベストアンサー選択時の answered_tags 追記＝マッチングの実績
--     タグ蓄積(No.27)が admin upsert で 42501 失敗し続けていたのを解消）。
--     service_role は BYPASSRLS のトラスト済みサーバーロールで、既に questions/
--     answers 等の特権書き込みに使用しているため付与しても新たなリスクは無い。
-- ============================================================

-- (1) 閲覧数インクリメント
create or replace function increment_view_count(p_question_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update questions set view_count = view_count + 1 where id = p_question_id;
end $$;
revoke execute on function increment_view_count(uuid) from public;
grant  execute on function increment_view_count(uuid) to anon, authenticated;

-- (2) service_role の tenant_profiles 書き込み権限
grant insert, update on public.tenant_profiles to service_role;
