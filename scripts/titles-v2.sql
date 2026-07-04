-- ============================================================
-- 称号システム v2 — Supabaseのクエリエディタで実行
-- ============================================================

-- 1. profilesに新カラム追加
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS question_count        int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS solved_question_count int NOT NULL DEFAULT 0;

-- 2. 既存データをクリア（制約変更前に空にする）
UPDATE profiles SET active_title_id = NULL;
DELETE FROM user_titles;
DELETE FROM titles;

-- 3. condition_typeのCHECK制約を更新（テーブルが空なので安全）
ALTER TABLE titles DROP CONSTRAINT IF EXISTS titles_condition_type_check;
ALTER TABLE titles ADD CONSTRAINT titles_condition_type_check
  CHECK (condition_type IN ('answer_count', 'hard_quest', 'question_count', 'solved_question_count'));

-- 4. 新称号25種を挿入
INSERT INTO titles (id, name, description, condition_type, condition_value, rarity) VALUES
  -- 回答系
  ('answer_1',   '見習い解答者',   '1回回答した',    'answer_count', 1,   'common'),
  ('answer_2',   '初級解答者',     '2回回答した',    'answer_count', 2,   'common'),
  ('answer_3',   '中級解答者',     '3回回答した',    'answer_count', 3,   'common'),
  ('answer_5',   '上級解答者',     '5回回答した',    'answer_count', 5,   'rare'),
  ('answer_10',  '知恵者',         '10回回答した',   'answer_count', 10,  'rare'),
  ('answer_20',  '賢者',           '20回回答した',   'answer_count', 20,  'rare'),
  ('answer_100', '伝説の解答者',   '100回回答した',  'answer_count', 100, 'legendary'),
  -- 高難度系
  ('hard_1',   '見習い挑戦者',     '高難度1回解決',    'hard_quest', 1,   'common'),
  ('hard_2',   '初級挑戦者',       '高難度2回解決',    'hard_quest', 2,   'common'),
  ('hard_3',   '中級挑戦者',       '高難度3回解決',    'hard_quest', 3,   'common'),
  ('hard_5',   '上級挑戦者',       '高難度5回解決',    'hard_quest', 5,   'rare'),
  ('hard_10',  '難問を求めし者',   '高難度10回解決',   'hard_quest', 10,  'rare'),
  ('hard_20',  '挑みし者',         '高難度20回解決',   'hard_quest', 20,  'rare'),
  ('hard_100', '伝説の挑戦者',     '高難度100回解決',  'hard_quest', 100, 'legendary'),
  -- 質問投稿系
  ('question_1',  '初質問者',       '1回質問した',   'question_count', 1,  'common'),
  ('question_2',  '好奇心の塊',     '2回質問した',   'question_count', 2,  'common'),
  ('question_5',  '好奇心旺盛',     '5回質問した',   'question_count', 5,  'common'),
  ('question_10', '探求者',         '10回質問した',  'question_count', 10, 'rare'),
  -- 質問解決済み系
  ('solved_1',  '見習い依頼者',   '1回解決された',   'solved_question_count', 1,  'common'),
  ('solved_2',  '初級依頼者',     '2回解決された',   'solved_question_count', 2,  'common'),
  ('solved_3',  '中級依頼者',     '3回解決された',   'solved_question_count', 3,  'common'),
  ('solved_5',  '上級依頼者',     '5回解決された',   'solved_question_count', 5,  'rare'),
  ('solved_10', '解決人',         '10回解決された',  'solved_question_count', 10, 'rare'),
  ('solved_20', '解決の達人',     '20回解決された',  'solved_question_count', 20, 'rare'),
  ('solved_50', '伝説の解決人',   '50回解決された',  'solved_question_count', 50, 'legendary');

-- 5. インクリメント関数を追加
CREATE OR REPLACE FUNCTION increment_question_count(uid uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE profiles SET question_count = question_count + 1 WHERE id = uid;
$$;

CREATE OR REPLACE FUNCTION increment_solved_question_count(uid uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE profiles SET solved_question_count = solved_question_count + 1 WHERE id = uid;
$$;

-- 6. check_and_award_titles 関数を更新
CREATE OR REPLACE FUNCTION check_and_award_titles(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_answer_count          int;
  v_hard_quest_count      int;
  v_question_count        int;
  v_solved_question_count int;
  v_title                 record;
BEGIN
  SELECT answer_count, hard_quest_count, question_count, solved_question_count
    INTO v_answer_count, v_hard_quest_count, v_question_count, v_solved_question_count
    FROM profiles WHERE id = p_user_id;

  FOR v_title IN SELECT id, condition_type, condition_value FROM titles LOOP
    IF v_title.condition_type = 'answer_count'
       AND v_answer_count >= v_title.condition_value THEN
      INSERT INTO user_titles (user_id, title_id)
      VALUES (p_user_id, v_title.id) ON CONFLICT DO NOTHING;
    END IF;

    IF v_title.condition_type = 'hard_quest'
       AND v_hard_quest_count >= v_title.condition_value THEN
      INSERT INTO user_titles (user_id, title_id)
      VALUES (p_user_id, v_title.id) ON CONFLICT DO NOTHING;
    END IF;

    IF v_title.condition_type = 'question_count'
       AND v_question_count >= v_title.condition_value THEN
      INSERT INTO user_titles (user_id, title_id)
      VALUES (p_user_id, v_title.id) ON CONFLICT DO NOTHING;
    END IF;

    IF v_title.condition_type = 'solved_question_count'
       AND v_solved_question_count >= v_title.condition_value THEN
      INSERT INTO user_titles (user_id, title_id)
      VALUES (p_user_id, v_title.id) ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;
