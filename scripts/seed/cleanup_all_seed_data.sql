-- ============================================================================
-- 旧seed/テストデータの全削除（本物の67問を投稿する前の下準備）
--   作成: 2026-08-08
--   実行: Supabase SQL Editor に全文を貼って一度に実行する
--
-- 【消すもの】
--   - questions 全件（実測176件: debug 137 / dtm 39）
--   - answers 全件（128件。questions の ON DELETE CASCADE で自動的に消える）
--   - donations のうち上記 questions を参照する行（カスケード指定が無いため先に消す）
--   - user_titles 全件（実績が0になるので、獲得済み称号も外す）
--   - rate_limits 全件（古いカウントを持ち越さない）
--   - tenant_profiles / profiles の実績カウント（0にリセット）
--
-- 【消さないもの】
--   - tenants（テナント定義10件）
--   - profiles / auth.users（テストアカウントは残す。Googleログインのみ化は別作業）
--   - tenant_profiles の行そのもの
--     ★重要: display_name / skill_tags / is_available / email_notify を持っており、
--     本人アカウントの MUSIC PRODUCTION 用スキルタグもここに入っている。
--     行ごと消すと「妻の質問が本人にマッチする」設定まで消えるので、
--     カウンタだけをリセットする。
--   - titles（称号マスタ）
--
-- 全体が1つのトランザクションなので、途中でエラーが出れば何も変更されない。
-- ============================================================================


-- ============================================================
-- STEP 0: 実行前の状態を確認する（この2つだけ先に実行してもよい）
-- ============================================================
select 'BEFORE' as phase, tenant_id, count(*) as questions
from questions group by tenant_id order by tenant_id;

select 'BEFORE' as phase,
  (select count(*) from questions)       as questions,
  (select count(*) from answers)         as answers,
  (select count(*) from donations)       as donations,
  (select count(*) from user_titles)     as user_titles,
  (select count(*) from rate_limits)     as rate_limits,
  (select count(*) from tenant_profiles) as tenant_profiles,
  (select count(*) from profiles)        as profiles,
  (select count(*) from tenants)         as tenants;


-- ============================================================
-- STEP 1〜6: 削除とリセット（ここから下をまとめて実行）
-- ============================================================
begin;

-- STEP 1: donations を先に消す
--   donations.question_id は questions(id) を参照しているが ON DELETE CASCADE が
--   付いていないため、残っていると STEP 2 が外部キー違反で失敗する。
--   投げ銭機能は未実装なので通常は0件のはず。
delete from donations;

-- STEP 2: 質問を全件削除
--   answers.question_id は ON DELETE CASCADE なので、回答128件もここで一緒に消える。
delete from questions;

-- STEP 3: 獲得済みの称号を外す
--   実績カウントが0になるため、seedで得た称号は保持していない状態に揃える。
--   titles（称号マスタ）は消さない。
--   ※ active_title_id を先にnullにしてから user_titles を消す。
update tenant_profiles set active_title_id = null where active_title_id is not null;
update profiles        set active_title_id = null where active_title_id is not null;
delete from user_titles;

-- STEP 4: テナント別プロフィールの実績カウントをリセット
--   行は消さない（スキルタグ・稼働状態・表示名・通知設定を保持するため）。
--   answered_tags は「ベストアンサーで蓄積した回答実績タグ」なので空にする。
update tenant_profiles
set answer_count          = 0,
    hard_quest_count      = 0,
    question_count        = 0,
    solved_question_count = 0,
    answered_tags         = '{}';

-- STEP 5: profiles 側の旧カウンタもリセット
--   2026-07-14以降アプリからは参照していない凍結カラムだが、
--   将来の集計ミスや誤読を防ぐため0に揃えておく。
update profiles
set answer_count          = 0,
    hard_quest_count      = 0,
    question_count        = 0,
    solved_question_count = 0,
    answered_tags         = '{}';

-- STEP 6: レート制限のカウントを消す
--   24時間ウィンドウで自動リセットされる仕組みだが、
--   投稿を始める初日に古いカウントを持ち越さないようにする。
delete from rate_limits;

commit;


-- ============================================================
-- STEP 7: 実行後の確認（すべて0になっていること）
-- ============================================================
select 'AFTER' as phase,
  (select count(*) from questions)   as questions,      -- 0
  (select count(*) from answers)     as answers,        -- 0
  (select count(*) from donations)   as donations,      -- 0
  (select count(*) from user_titles) as user_titles,    -- 0
  (select count(*) from rate_limits) as rate_limits;    -- 0

-- 残っているべきものが残っているか
select 'KEPT' as phase,
  (select count(*) from tenants)         as tenants,          -- 10
  (select count(*) from profiles)        as profiles,         -- 13
  (select count(*) from tenant_profiles) as tenant_profiles,  -- 26
  (select count(*) from titles)          as titles;           -- 称号マスタ（実行前と同じ数）

-- カウンタが全部0になっているか（0行になるのが正解）
select tenant_id, user_id, answer_count, question_count, solved_question_count, hard_quest_count
from tenant_profiles
where answer_count <> 0 or question_count <> 0
   or solved_question_count <> 0 or hard_quest_count <> 0;

-- スキルタグが消えていないことの確認（本人アカウントのMUSIC PRODUCTION設定）
-- 期待: dtm の行に音楽系タグが15件ほど入ったまま
select tenant_id, user_id, display_name, is_available, array_length(skill_tags, 1) as skill_tag_count
from tenant_profiles
where array_length(skill_tags, 1) > 0
order by tenant_id;


-- ============================================================
-- （任意）STEP 8: AI使用量の履歴も消す場合だけ実行する
--   questions とは無関係の日次集計（実測2行）。
--   管理ダッシュボードの「本日のAI使用」等の表示に使われる。
--   過去のAPI利用実績の記録でもあるので、消すかどうかは好みで判断する。
-- ============================================================
-- delete from ai_usage;
