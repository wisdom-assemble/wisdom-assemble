-- ============================================================================
-- 【重大】人間の回答が一切INSERTできない状態を修正する
--   作成: 2026-08-08
--   実行: Supabase SQL Editor（適用しないと人間回答が投稿できないまま）
--
-- 【症状】
--   is_ai=false かつ user_id ありの回答をINSERTすると必ず失敗する:
--     23502: null value in column "tenant_id" of relation "user_titles"
--            violates not-null constraint
--   AI回答（user_id なし）は成功するため、AIが答えた質問だけが正常に見え、
--   人間が答えようとした瞬間にエラーになる。
--
-- 【原因】
--   answers への after insert トリガー on_answer_created → handle_new_answer()
--   が、2026-06-26の初期スキーマのまま「テナントを知らない」実装だった。
--     1. profiles.answer_count を更新している
--        → 2026-07-14のテナント分離以降、マッチングが見るのは
--          tenant_profiles.answer_count なので、そもそも更新先が違う（凍結カラム）
--     2. check_and_award_titles(new.user_id) と1引数版を呼んでいる
--        → 1引数版は insert into user_titles (user_id, title_id) と
--          tenant_id を入れずにINSERTする。2026-07-13に user_titles へ
--          tenant_id が追加され複合キー（＝NOT NULL）になったため、
--          ここで必ず NOT NULL 違反になり、回答のINSERT自体が巻き戻る。
--
-- 【なぜ今まで気づかなかったか】
--   seedの回答はすべて2026-07-13より前にSQLで投入されており、それ以降
--   実際の人間回答が1件も投稿されていなかったため。
--
-- 【修正内容】
--   トリガー関数をテナント対応の2引数版に差し替える。
--   これで①回答のINSERTが通る ②tenant_profiles.answer_count が正しく増える
--   （マッチングのスコア加点 answer_count*0.3 が機能する）③称号がテナント別に
--   付与される、の3つが同時に直る。
--   なお increment_answer_count は ON CONFLICT で tenant_profiles の行を作るため、
--   回答した時点でそのテナントの住人になる（既存の想定どおり）。
--
--   1引数版の check_and_award_titles / increment_* は後方互換のため残すが、
--   アプリからもトリガーからも呼ばれなくなる。
-- ============================================================================

-- 実行前の確認: 現在のトリガー関数の定義（1引数版を呼んでいるはず）
select prosrc from pg_proc where proname = 'handle_new_answer';


create or replace function handle_new_answer()
returns trigger language plpgsql security definer as $$
begin
  -- AI回答（user_id なし）は対象外。実績も称号も人間の回答にだけ付く。
  if new.is_ai = false and new.user_id is not null then
    -- テナント別の回答数を加算（マッチングのスコアが参照するのはこちら）
    perform increment_answer_count(new.user_id, new.tenant_id);
    -- 称号の判定・付与もテナント別に行う（user_titles.tenant_id が NOT NULL）
    perform check_and_award_titles(new.user_id, new.tenant_id);
  end if;
  return new;
end;
$$;

-- トリガー自体は初期スキーマのまま（after insert on answers）。
-- 関数を差し替えるだけで有効になるため、トリガーの作り直しは不要。


-- ============================================================================
-- 実行後の確認
-- ============================================================================
-- 1. 関数がテナント版を呼ぶようになったか（increment_answer_count と
--    check_and_award_titles が2引数で現れること）
select prosrc from pg_proc where proname = 'handle_new_answer';

-- 2. 人間回答が実際に通るかは、アプリから1件投稿して確認するのが確実。
--    （エンジニアは service_role で直接INSERTして検証済み。
--      検証用データは削除済みで、questions/answers とも0件に戻してある）
