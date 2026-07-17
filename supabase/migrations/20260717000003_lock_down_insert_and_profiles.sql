-- ログイン済みユーザーのAPI直叩きによる各種バイパスを塞ぐ（第2弾）。
--
-- 【重要・適用順序】アプリ側の対応コード（questions/route.ts の質問INSERTをservice_role化、
-- questions/route.ts・answers/route.ts にBANチェック追加）を本番デプロイした「後」に適用すること。
-- service_role はRLS・列権限をバイパスするため、デプロイ後であればUX・投稿挙動は一切変わらない。

-- ============================================================
-- ① questions への直接INSERTを塞ぐ。
--    アプリは認証・レート制限・コンテンツフィルタ・ジャンル判定を通した後、
--    service_role でINSERTするよう変更済み。一般ロールからの直接INSERTは、
--    それらの検査を飛ばせてしまうため全面的に拒否する。
--    （ブラウザからの questions への直接INSERTは存在しない）
-- ============================================================
drop policy if exists "questions_insert" on questions;
create policy "questions_insert" on questions for insert with check (false);

-- ============================================================
-- ② profiles: 一般ユーザーが更新してよいのは language 列のみに限定する。
--    is_banned を本人が false に書き戻す等の自己改ざんを防ぐ（列単位GRANT）。
--    is_banned の変更は管理者API(service_role)のみ。
--    RLSポリシー(auth.uid() = id)はそのまま維持。
-- ============================================================
revoke update on profiles from anon, authenticated;
grant update (language) on profiles to authenticated;

-- ============================================================
-- ③ tenant_profiles: 実績カウント・回答実績タグの自己水増し（マッチング順位操作）を防ぐ。
--    本人がマイページで編集する列だけ INSERT/UPDATE を許可する（列単位GRANT）。
--    answer_count / hard_quest_count / question_count / solved_question_count /
--    answered_tags は service_role のRPCのみが更新できる。
--    さらに active_title_id は「保有している称号のみ」装備可とし、未獲得称号の装備を防ぐ。
-- ============================================================
revoke insert, update on tenant_profiles from anon, authenticated;
grant insert (tenant_id, user_id, display_name, skill_tags, is_available, email_notify, active_title_id)
  on tenant_profiles to authenticated;
grant update (display_name, skill_tags, is_available, email_notify, active_title_id)
  on tenant_profiles to authenticated;

drop policy if exists "tenant_profiles_insert" on tenant_profiles;
create policy "tenant_profiles_insert" on tenant_profiles for insert
  with check (
    auth.uid() = user_id
    and (
      active_title_id is null
      or exists (
        select 1 from user_titles ut
        where ut.user_id = tenant_profiles.user_id
          and ut.tenant_id = tenant_profiles.tenant_id
          and ut.title_id = tenant_profiles.active_title_id
      )
    )
  );

drop policy if exists "tenant_profiles_update" on tenant_profiles;
create policy "tenant_profiles_update" on tenant_profiles for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      active_title_id is null
      or exists (
        select 1 from user_titles ut
        where ut.user_id = tenant_profiles.user_id
          and ut.tenant_id = tenant_profiles.tenant_id
          and ut.title_id = tenant_profiles.active_title_id
      )
    )
  );
