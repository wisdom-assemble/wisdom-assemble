-- フェーズA：プロフィール拡張 + ステータス拡張

-- profilesにスキルタグと回答ステータスを追加
alter table profiles
  add column if not exists skill_tags text[] not null default '{}',
  add column if not exists is_available boolean not null default true;

-- questionsのstatusにmatched_cを追加（既存のenumがあれば拡張、なければそのまま）
-- matched_b_id / matched_c_id も追加（誰がB/Cとして対応したか記録）
alter table questions
  add column if not exists matched_b_id uuid references profiles(id),
  add column if not exists matched_c_id uuid references profiles(id);

-- answersにai_scoreカラムを追加（既にある場合はスキップ）
alter table answers
  add column if not exists ai_score int;

-- increment_answer_count関数（ベストアンサー選択時に呼ぶ）
create or replace function increment_answer_count(uid uuid)
returns void language plpgsql security definer as $$
begin
  update profiles set answer_count = answer_count + 1 where id = uid;
end;
$$;
