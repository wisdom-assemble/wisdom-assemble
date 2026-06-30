-- フェーズC：マッチング改善・回答実績タグ・称号システム完成

-- 1. profiles に answered_tags（回答実績タグ）を追加
alter table profiles
  add column if not exists answered_tags text[] not null default '{}';

-- 2. questions に tags（質問タグ）を追加（将来のタグフィルター検索のため）
alter table questions
  add column if not exists tags text[] not null default '{}';

-- 3. 称号取得時にactive_title_idを自動で最高レアリティ称号に設定する関数を更新
-- rarity: common < rare < legendary の順でより良い称号を優先
create or replace function check_and_award_titles(p_user_id uuid)
returns void language plpgsql security definer as $$
declare
  v_answer_count     int;
  v_hard_quest_count int;
  v_title            record;
  v_best_title_id    text;
begin
  select answer_count, hard_quest_count
    into v_answer_count, v_hard_quest_count
    from profiles where id = p_user_id;

  for v_title in
    select id, condition_type, condition_value from titles
  loop
    if v_title.condition_type = 'answer_count'
       and v_answer_count >= v_title.condition_value then
      insert into user_titles (user_id, title_id)
      values (p_user_id, v_title.id)
      on conflict do nothing;
    end if;

    if v_title.condition_type = 'hard_quest'
       and v_hard_quest_count >= v_title.condition_value then
      insert into user_titles (user_id, title_id)
      values (p_user_id, v_title.id)
      on conflict do nothing;
    end if;
  end loop;

  -- 最高レアリティ称号を active_title_id に自動設定
  select t.id into v_best_title_id
    from user_titles ut
    join titles t on t.id = ut.title_id
    where ut.user_id = p_user_id
    order by
      case t.rarity
        when 'legendary' then 3
        when 'rare' then 2
        when 'common' then 1
        else 0
      end desc,
      t.condition_value desc nulls last
    limit 1;

  if v_best_title_id is not null then
    update profiles set active_title_id = v_best_title_id
    where id = p_user_id and (active_title_id is null or active_title_id != v_best_title_id);
  end if;
end;
$$;

-- 4. スコアベースの称号も追加（現行の定義に合わせて）
-- 既存の称号をユーザー向けの名前に更新
update titles set name = '初回答者', description = '初めて回答した'    where id = 'apprentice';
update titles set name = '知恵袋',   description = '10回以上回答した'  where id = 'sage';
update titles set name = '賢者',     description = '50回以上回答した'  where id = 'elder';
update titles set name = 'マスター', description = '100回以上回答した' where id = 'master';
