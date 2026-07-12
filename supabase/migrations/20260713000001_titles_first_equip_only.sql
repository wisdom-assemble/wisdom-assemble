-- 称号の自動装備を「未装備(active_title_id IS NULL)の場合のみ」に変更する。
-- 従来は称号チェックのたびに保有称号中で最もレア度が高いものへ毎回強制上書きしており、
-- マイページで手動選択した称号が次の投稿・回答で勝手に戻ってしまう問題があった。
-- 初回獲得時のみ自動装備し、以降はユーザーの手動選択を尊重する。
create or replace function check_and_award_titles(p_user_id uuid)
returns void language plpgsql security definer as $$
declare
  v_answer_count     int;
  v_hard_quest_count int;
  v_title            record;
  v_best_title_id    text;
  v_has_active       boolean;
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

  -- 未装備(NULL)の場合のみ、最高レアリティ称号を自動でactive_title_idに設定する
  select active_title_id is not null into v_has_active
    from profiles where id = p_user_id;

  if not v_has_active then
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
      where id = p_user_id and active_title_id is null;
    end if;
  end if;
end;
$$;
