import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const sqls = [
  // 1. answered_tagsカラム追加
  `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS answered_tags text[] NOT NULL DEFAULT '{}'`,

  // 2. questionsにtagsカラム追加
  `ALTER TABLE questions ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'`,

  // 3. check_and_award_titles関数を更新（active_title_id自動設定）
  `CREATE OR REPLACE FUNCTION check_and_award_titles(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_answer_count     int;
  v_hard_quest_count int;
  v_title            record;
  v_best_title_id    text;
BEGIN
  SELECT answer_count, hard_quest_count
    INTO v_answer_count, v_hard_quest_count
    FROM profiles WHERE id = p_user_id;

  FOR v_title IN SELECT id, condition_type, condition_value FROM titles LOOP
    IF v_title.condition_type = 'answer_count' AND v_answer_count >= v_title.condition_value THEN
      INSERT INTO user_titles (user_id, title_id) VALUES (p_user_id, v_title.id) ON CONFLICT DO NOTHING;
    END IF;
    IF v_title.condition_type = 'hard_quest' AND v_hard_quest_count >= v_title.condition_value THEN
      INSERT INTO user_titles (user_id, title_id) VALUES (p_user_id, v_title.id) ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  SELECT t.id INTO v_best_title_id
    FROM user_titles ut
    JOIN titles t ON t.id = ut.title_id
    WHERE ut.user_id = p_user_id
    ORDER BY
      CASE t.rarity WHEN 'legendary' THEN 3 WHEN 'rare' THEN 2 WHEN 'common' THEN 1 ELSE 0 END DESC,
      t.condition_value DESC NULLS LAST
    LIMIT 1;

  IF v_best_title_id IS NOT NULL THEN
    UPDATE profiles SET active_title_id = v_best_title_id
    WHERE id = p_user_id AND (active_title_id IS NULL OR active_title_id != v_best_title_id);
  END IF;
END;
$$`,

  // 4. 称号名を日本語に更新
  `UPDATE titles SET name = '初回答者', description = '初めて回答した' WHERE id = 'apprentice'`,
  `UPDATE titles SET name = '知恵袋',   description = '10回以上回答した' WHERE id = 'sage'`,
  `UPDATE titles SET name = '賢者',     description = '50回以上回答した' WHERE id = 'elder'`,
  `UPDATE titles SET name = 'マスター', description = '100回以上回答した' WHERE id = 'master'`,
]

async function main() {
  for (const sql of sqls) {
    const preview = sql.slice(0, 60).replace(/\n/g, ' ')
    const { error } = await supabase.rpc('exec_sql_admin', { query: sql }).single()
    if (error) {
      // rpc不可の場合は直接REST経由
      console.log(`⚠️  RPC不可: ${preview}...`)
      console.log('   → SupabaseダッシュボードのSQL Editorで手動実行してください')
    } else {
      console.log(`✅ ${preview}`)
    }
  }
}

main().catch(console.error)
