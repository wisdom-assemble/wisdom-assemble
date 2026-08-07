-- ============================================================================
-- テストアカウントをマッチング対象から外す
--   作成: 2026-08-08
--   実行: Supabase SQL Editor
--
-- 【目的】
--   本物の質問投稿は、実在の人が実在のGoogleアカウントで行う。
--   @test.com のテストアカウントに質問が割り当てられてしまうと、
--   「実在の人が答えている」というAdSenseの前提が崩れる。
--   そのためテストアカウントを回答候補から完全に外す。
--
-- 【なぜ is_available と skill_tags の両方を触るか】
--   マッチング(src/lib/matching.ts:50)は tenant_profiles の is_available=true の
--   行だけを候補にする。よって is_available=false だけで候補から外れる。
--   skill_tags を空にするのは二重の保険＋データの整理。
--   テストアカウントは音楽テナント(dtm)にも React / TypeScript / AWS といった
--   プログラミング系タグを持っており（2026-07-14のテナント分離時に全テナントへ
--   複製された名残）、ジャンルと合っていないため。
--
-- 【profiles 側は触らない】
--   profiles にも is_available / skill_tags 列があるが、2026-07-14以降
--   アプリからは参照されていない凍結カラム（grep で確認済み。読んでいるのは
--   matching.ts と profile/page.tsx の tenant_profiles のみ）。
-- ============================================================================


-- ============================================================
-- STEP 0: 実行前の確認
-- ============================================================
select u.email,
       (u.raw_app_meta_data->>'provider') as provider,
       tp.tenant_id, tp.is_available,
       coalesce(array_length(tp.skill_tags, 1), 0) as skill_tags
from tenant_profiles tp
join auth.users u on u.id = tp.user_id
order by u.email, tp.tenant_id;


-- ============================================================
-- STEP 1: テストアカウント(@test.com)を全テナントで候補から外す
-- ============================================================
begin;

update tenant_profiles tp
set is_available = false,
    skill_tags   = '{}'
from auth.users u
where u.id = tp.user_id
  and u.email like '%@test.com';

-- 管理アカウント(wisdomassemble@gmail.com)も候補から外す。
--   このアカウントは運営・管理用で、質問にも回答にも使わない。
--   外しておかないと、実在アカウントで投稿した質問がこの管理アカウントに
--   割り当てられてしまう（＝誰も答えられない状態になる）。
--   ※あとで戻したくなったら is_available = true に更新するだけでよい。
update tenant_profiles tp
set is_available = false
from auth.users u
where u.id = tp.user_id
  and u.email = 'wisdomassemble@gmail.com';

commit;


-- ============================================================
-- STEP 2: 実行後の確認
-- ============================================================
-- 候補として残っている行（この時点では0件になるのが正しい）
select u.email, tp.tenant_id, tp.is_available,
       coalesce(array_length(tp.skill_tags, 1), 0) as skill_tags
from tenant_profiles tp
join auth.users u on u.id = tp.user_id
where tp.is_available
order by u.email, tp.tenant_id;

-- テナント別の候補数（すべて0になること）
select tenant_id, count(*) filter (where is_available) as available_candidates
from tenant_profiles
group by tenant_id
order by tenant_id;


-- ============================================================
-- 【重要】このあとの手順
--   この時点で回答候補は0人になる。findMatch は候補が0だと null を返し
--   （matching.ts:53）、質問は誰にも割り当てられず高難度へ回る。
--
--   したがって、奥さんが最初の質問を投稿する前に、
--   ご本人が個人のGoogleアカウントで次を済ませておく必要がある:
--     1. 対象テナント（music-prod など）にGoogleログイン
--     2. マイページを開く
--     3. 「表示名」と「得意なこと」を設定して【保存する】を押す
--        → ここで初めて tenant_profiles に行が作られ、is_available=true になる
--     4. テナントごとに 1〜3 を行う（テナント別に行が分かれているため）
--
--   奥さんのアカウントはマイページで保存しないこと。
--   保存すると回答候補に入ってしまい、奥さん自身の質問が
--   奥さんに割り当てられる可能性がある。
-- ============================================================
