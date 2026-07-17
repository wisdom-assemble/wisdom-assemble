-- 公開anonキーからの直接改ざん・不正実行を防ぐため、DBの書き込み権限を締める。
--
-- 【重要・適用順序】このマイグレーションは、アプリ側の書き込みを service_role 経由に
-- 変更したコード（src/app/api/questions/route.ts / accept / escalate / review は対応済み）
-- が本番にデプロイされた「後」に適用すること。
-- 先にこのSQLを適用すると、旧コード（一般ユーザー権限で書き込む版）が動いている間は
-- 質問投稿が失敗する。service_role はRLS・EXECUTE制限をバイパスするため、
-- デプロイ後であればアプリの挙動・UXフロー(①〜⑥)は一切変わらない。

-- ============================================================
-- ① questions のUPDATEを「自分の質問のみ」に戻す
--    （20260627000002 で using(true) = 全世界に開放されていたのを是正）
--    アプリの質問更新は service_role 経由なのでRLSをバイパスし影響を受けない。
--    ブラウザからの questions への直接UPDATEは存在しない（読み取りのみ）。
-- ============================================================
drop policy if exists "questions_update" on questions;
create policy "questions_update" on questions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- ② answers のINSERTから「is_ai = true なら誰でも挿入可」を削除する。
--    偽のAI回答を未認証で挿入されるのを防ぐ。
--    AI回答の挿入は service_role 経由（questions/route.ts）なのでRLSをバイパスし継続動作。
--    人間の回答は user_id = auth.uid() を満たすため従来どおり挿入できる。
-- ============================================================
drop policy if exists "answers_insert" on answers;
create policy "answers_insert" on answers
  for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- ③ security definer なRPCの実行権限を、一般ロールから剥奪し service_role のみに限定する。
--    他人のuser_idを指定した実績水増しや、レート制限枠を消費させる嫌がらせを防ぐ。
--    アプリは全RPCを service_role 経由で呼ぶ（questions/route.ts・accept/route.ts 対応済み）。
--    実在する全オーバーロードを動的に処理するため、シグネチャ差異・移行漏れの影響を受けない。
-- ============================================================
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'check_and_increment_rate_limit',
        'increment_answer_count',
        'increment_hard_quest_count',
        'increment_question_count',
        'increment_solved_question_count',
        'check_and_award_titles'
      )
  loop
    execute format('revoke execute on function %s from public', r.sig);
    execute format('revoke execute on function %s from anon', r.sig);
    execute format('revoke execute on function %s from authenticated', r.sig);
    execute format('grant execute on function %s to service_role', r.sig);
  end loop;
end $$;
