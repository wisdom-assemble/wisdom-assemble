-- 称号の自動装備「初回のみ」修正が、テナント対応版(2引数)の
-- check_and_award_titles に反映されていなかった回帰を修正する。
--
-- 経緯:
--   20260713000001 で 1引数版を「未装備(active_title_id IS NULL)のときだけ自動装備」に修正したが、
--   その直後の 20260713000002 で追加したテナント対応の 2引数版（アプリが実際に呼ぶ方）は
--   旧ロジック `and (active_title_id is null or active_title_id != v_best_title_id)` のままだった。
--   このため質問投稿・ベストアンサー選択のたびに、マイページで手動選択した称号が
--   最高レアリティの称号へ強制的に上書きされていた。
--
-- 本修正:
--   末尾のUPDATE条件を `and active_title_id is null` に変更し、
--   未装備の場合のみ自動装備、以降はユーザーの手動選択を尊重する（1引数版と同じ挙動に統一）。
--   称号の付与(user_titlesへのINSERT)ロジックは一切変更しない。

create or replace function check_and_award_titles(p_user_id uuid, p_tenant_id text)
returns void language plpgsql security definer as $$
declare
  v_answer_count          int;
  v_hard_quest_count      int;
  v_question_count        int;
  v_solved_question_count int;
  v_title                 record;
  v_best_title_id         text;
begin
  select answer_count, hard_quest_count, question_count, solved_question_count
    into v_answer_count, v_hard_quest_count, v_question_count, v_solved_question_count
    from tenant_profiles where tenant_id = p_tenant_id and user_id = p_user_id;

  for v_title in select id, condition_type, condition_value from titles loop
    if v_title.condition_type = 'answer_count' and v_answer_count >= v_title.condition_value then
      insert into user_titles (user_id, title_id, tenant_id) values (p_user_id, v_title.id, p_tenant_id) on conflict do nothing;
    end if;
    if v_title.condition_type = 'hard_quest' and v_hard_quest_count >= v_title.condition_value then
      insert into user_titles (user_id, title_id, tenant_id) values (p_user_id, v_title.id, p_tenant_id) on conflict do nothing;
    end if;
    if v_title.condition_type = 'question_count' and v_question_count >= v_title.condition_value then
      insert into user_titles (user_id, title_id, tenant_id) values (p_user_id, v_title.id, p_tenant_id) on conflict do nothing;
    end if;
    if v_title.condition_type = 'solved_question_count' and v_solved_question_count >= v_title.condition_value then
      insert into user_titles (user_id, title_id, tenant_id) values (p_user_id, v_title.id, p_tenant_id) on conflict do nothing;
    end if;
  end loop;

  select t.id into v_best_title_id
    from user_titles ut
    join titles t on t.id = ut.title_id
    where ut.user_id = p_user_id and ut.tenant_id = p_tenant_id
    order by
      case t.rarity when 'legendary' then 3 when 'rare' then 2 when 'common' then 1 else 0 end desc,
      t.condition_value desc nulls last
    limit 1;

  -- 未装備(NULL)のときだけ自動装備する。既に手動/自動で装備済みなら上書きしない。
  if v_best_title_id is not null then
    update tenant_profiles set active_title_id = v_best_title_id
    where tenant_id = p_tenant_id and user_id = p_user_id
      and active_title_id is null;
  end if;
end;
$$;
