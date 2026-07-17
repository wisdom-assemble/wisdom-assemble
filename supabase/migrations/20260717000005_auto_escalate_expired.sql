-- 8時間の期限切れ質問を自動的に高難度(hard)へ移行する（質問の滞留＝サービス停止を防ぐ）。
--
-- 背景: 使い方・質問詳細では「8時間以内に回答が来なければ自動で高難度に移行」と案内しているが、
-- 実際には質問者のボタン操作でしか遷移せず、専門家が放置すると質問がopen/matched_cのまま滞留していた。
-- pg_cronで定期的に「担当の専門家が期限内に回答しなかった質問」を高難度公開する。
--
-- 判定ルール（ゴースト＝担当者が期限切れまで未回答のケースのみ自動移行。回答済みは質問者の判断に委ねる）:
--   - status='open'      かつ matched_b_deadline < now() かつ 人間の回答が1件も無い → hard
--   - status='matched_c' かつ matched_c_deadline < now() かつ matched_c本人の回答が無い → hard
-- solved/hard/ai_answered は対象外。
--
-- 【前提】Supabaseで pg_cron 拡張が有効であること（Dashboard > Database > Extensions で pg_cron を有効化、
-- もしくは下の create extension が権限的に通ればそれでOK）。

create extension if not exists pg_cron;

create or replace function auto_escalate_expired()
returns void language plpgsql security definer as $$
begin
  -- 専門家1(B)が期限内に未回答（人間の回答ゼロ）→ 高難度公開
  update questions q
  set status = 'hard'
  where q.status = 'open'
    and q.matched_b_deadline is not null
    and q.matched_b_deadline < now()
    and not exists (
      select 1 from answers a
      where a.question_id = q.id and a.is_ai = false
    );

  -- 専門家2(C)が期限内に未回答（C本人の回答が無い）→ 高難度公開
  update questions q
  set status = 'hard'
  where q.status = 'matched_c'
    and q.matched_c_deadline is not null
    and q.matched_c_deadline < now()
    and not exists (
      select 1 from answers a
      where a.question_id = q.id and a.user_id = q.matched_c_id and a.is_ai = false
    );
end;
$$;

-- 一般ロールからの直接実行は禁止（アプリからは呼ばない。cronのみ）
revoke execute on function auto_escalate_expired() from public, anon, authenticated;

-- 15分ごとに実行。既存の同名ジョブがあれば作り直す。
select cron.unschedule('auto-escalate-expired')
where exists (select 1 from cron.job where jobname = 'auto-escalate-expired');

select cron.schedule('auto-escalate-expired', '*/15 * * * *', $$ select auto_escalate_expired(); $$);
